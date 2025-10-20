<template>
  <!-- eslint-disable vue/attributes-order -->
  <v-container class="fill-height d-flex flex-column align-center" max-width="900">
    <!-- Peers grid -->
    <v-row v-if="peers.length > 0" class="justify-center" dense>
      <v-col
        v-for="peer in peers"
        :key="peer.id"
        cols="12"
        sm="6"
        md="4"
        class="d-flex justify-center"
      >
        <v-card
          class="pa-4 text-center"
          rounded="xl"
          :elevation="(transferById[peer.id] ?? false) ? 8 : 2"
          :class="{ 'bg-grey-lighten-4': (dropById[peer.id] ?? false) }"
          @dragover.prevent="onDragOver(peer)"
          @dragleave="onDragLeave(peer)"
          @drop.prevent="onDrop($event, peer)"
          @contextmenu.prevent="onRightClick(peer)"
          @touchstart="onTouchStart(peer)"
          @touchend="onTouchEnd($event, peer)"
        >
          <div class="d-flex flex-column align-center">
            <v-avatar size="72" class="mb-2">
              <v-icon :icon="iconForPeer(peer)" size="56" />
            </v-avatar>
            <div class="text-subtitle-1">{{ peer.name.displayName }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ peer.name.deviceName }}</div>
            <v-progress-circular
              v-if="(progress[peer.id] ?? 0) > 0 && (progress[peer.id] ?? 0) < 1"
              class="mt-3"
              :model-value="Math.round(100 * (progress[peer.id] ?? 0))"
              :size="52"
              :width="5"
              color="primary"
            />
            <div class="mt-3">
              <input
                class="d-none"
                multiple
                :id="`file-input-${peer.id}`"
                type="file"
                @change="onFilesSelected($event, peer)"
              >
              <v-btn color="primary" variant="flat" @click="triggerFile(peer)">
                Send files
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty state -->
    <div v-else class="text-center my-12">
      <h2 class="mb-4">Open Snapdrop on other devices to send files</h2>
      <div class="text-medium-emphasis">
        <span v-if="isMobile">Tap to send files or long tap to send a message</span>
        <span v-else>Click to send files or right click to send a message</span>
      </div>
    </div>

    <!-- Footer (click to open Join/QR dialog) -->
    <footer class="d-flex flex-column align-center mt-auto mb-6 text-center" @click="openJoinRoom" style="cursor: pointer;">
      <svg class="icon logo">
        <symbol id="wifi-tethering" viewBox="0 0 24 24">
          <path d="M12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 2c0-3.31-2.69-6-6-6s-6 2.69-6 6c0 2.22 1.21 4.15 3 5.19l1-1.74c-1.19-.7-2-1.97-2-3.45 0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.48-.81 2.75-2 3.45l1 1.74c1.79-1.04 3-2.97 3-5.19zM12 3C6.48 3 2 7.48 2 13c0 3.7 2.01 6.92 4.99 8.65l1-1.73C5.61 18.53 4 15.96 4 13c0-4.42 3.58-8 8-8s8 3.58 8 8c0 2.96-1.61 5.53-4 6.92l1 1.73c2.99-1.73 5-4.95 5-8.65 0-5.52-4.48-10-10-10z" />
        </symbol>
      </svg>
      <div :title="deviceNameTitle" class="text-body-1" id="displayName">
        {{ displayName || 'The easiest way to transfer data across devices' }}
      </div>
      <div class="text-body-2 text-medium-emphasis">You can be discovered by everyone on this network</div>
    </footer>

    <!-- Receive file dialog -->
    <v-dialog v-model="receiveDialog.show" persistent max-width="520">
      <v-card>
        <v-card-title>File Received</v-card-title>
        <v-card-text>
          <div class="text-subtitle-1">{{ receiveDialog.file?.name }}</div>
          <div class="text-body-2 text-medium-emphasis mb-3">{{ readableSize(receiveDialog.file?.size) }}</div>
          <div v-if="isImage(receiveDialog.file?.mime) && receiveDialog.previewUrl" class="mb-3">
            <v-img :src="receiveDialog.previewUrl" max-height="240" cover class="rounded" />
          </div>
          <v-checkbox
            v-model="receiveDialog.askBeforeDownload"
            label="Ask to save each file before downloading"
            hide-details
          />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="closeReceiveDialog">Ignore</v-btn>
          <v-btn
            v-if="receiveDialog.downloadUrl"
            color="primary"
            variant="flat"
            :href="receiveDialog.downloadUrl"
            :download="receiveDialog.file?.name || true"
            @click="onSaveClick"
            autofocus
          >Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Send text dialog -->
    <v-dialog v-model="sendTextDialog.show" max-width="520">
      <v-card tag="form" @submit.prevent="sendText">
        <v-card-title>Send a Message</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="sendTextDialog.text"
            autofocus
            auto-grow
            rows="2"
            label="Message"
          />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="sendTextDialog.show = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" type="submit">Send</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Join Room Dialog ( + QR) -->
    <v-dialog v-model="joinRoomDialog.show" max-width="560">
      <v-card tag="form" @submit.prevent="submitJoinRoom">
        <v-card-title>Join or Share Room</v-card-title>
        <v-card-text>
          <div class="mb-4 d-flex justify-center">
            <div ref="qrContainer" style="width: 240px; height: 240px;" />
          </div>
          <v-text-field
            v-model="joinRoomDialog.room"
            label="Room ID"
            autocomplete="off"
            clearable
            autofocus
          />
          <div class="text-caption text-medium-emphasis">Click footer to reopen this dialog.</div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="joinRoomDialog.show = false">Close</v-btn>
          <v-btn color="primary" variant="flat" type="submit">Join</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Receive text dialog -->
    <v-dialog v-model="receiveTextDialog.show" max-width="520">
      <v-card>
        <v-card-title>Message Received</v-card-title>
        <v-card-text>
          <div>
            <a v-if="isURL(receiveTextDialog.text)" :href="receiveTextDialog.text" target="_blank">{{ receiveTextDialog.text }}</a>
            <span v-else>{{ receiveTextDialog.text }}</span>
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="receiveTextDialog.show = false">Close</v-btn>
          <v-btn color="primary" variant="flat" @click="copyReceivedText" autofocus>Copy</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Toast -->
    <v-snackbar v-model="snackbar.show" :timeout="3000">{{ snackbar.message }}</v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
  import { QRCode, SVGRenderer as SVG } from '@forward-software/qrcodets'
  import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
  import { PeersManager, ServerConnection } from '@/scripts/network.js'

  import '@/styles/legacy.css'
  import '@/scripts/clipboard.js'

  // Types
  type PeerInfo = { id: string, name: { displayName: string, deviceName: string, device?: { type: 'mobile' | 'tablet' | 'desktop' } }, rtcSupported?: boolean }

  // Reactive state
  const peers = reactive<PeerInfo[]>([])
  const progress = reactive<Record<string, number>>({})
  const transferById = reactive<Record<string, boolean>>({})
  const dropById = reactive<Record<string, boolean>>({})
  const displayName = ref('')
  const deviceNameTitle = ref('')
  const isMobile = computed(() => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))

  const snackbar = reactive({ show: false, message: '' })

  const receiveDialog = reactive({
    show: false,
    file: null as null | { name: string, size: number, mime: string, blob: Blob },
    downloadUrl: '' as string,
    previewUrl: '' as string,
    askBeforeDownload: true,
  })

  const sendTextDialog = reactive({
    show: false,
    to: '' as string,
    text: '' as string,
  })

  const receiveTextDialog = reactive({
    show: false,
    text: '' as string,
  })

  // Join/Room QR dialog state
  const joinRoomDialog = reactive({
    show: false,
    room: '' as string,
  })
  const qrContainer = ref<HTMLElement | null>(null)
  let qrCodeInstance: QRCode | null = null

  // Helpers
  function isURL (text?: string) {
    return !!text && /^((https?:\/\/|www)[^\s]+)/gi.test(text.toLowerCase())
  }
  function isImage (mime?: string) {
    return !!mime && mime.startsWith('image/')
  }
  function readableSize (bytes?: number) {
    if (bytes == null) return ''
    if (bytes >= 1e9) return Math.round(bytes / 1e8) / 10 + ' GB'
    if (bytes >= 1e6) return Math.round(bytes / 1e5) / 10 + ' MB'
    if (bytes > 1000) return Math.round(bytes / 1000) + ' KB'
    return bytes + ' Bytes'
  }

  function iconForPeer (peer: PeerInfo) {
    const device = (peer.name as any).device || peer.name
    if (device?.type === 'mobile') return 'mdi-cellphone'
    if (device?.type === 'tablet') return 'mdi-tablet'
    return 'mdi-monitor'
  }

  // Peers actions
  function triggerFile (peer: PeerInfo) {
    const input = document.querySelector(`#file-input-${peer.id}`) as HTMLInputElement | null
    input?.click()
  }
  function onFilesSelected (e: Event, peer: PeerInfo) {
    const input = e.target as HTMLInputElement
    const files = input.files
    if (!files || files.length === 0) return
    _peersManager?.sendFiles(peer.id, files)
    input.value = ''
  }
  function onDrop (e: DragEvent, peer: PeerInfo) {
    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return
    _peersManager?.sendFiles(peer.id, files)
    onDragLeave(peer)
  }
  function onDragOver (peer: PeerInfo) {
    ;(dropById as any)[peer.id] = true
  }
  function onDragLeave (peer: PeerInfo) {
    ;(dropById as any)[peer.id] = false
  }
  function onRightClick (peer: PeerInfo) {
    sendTextDialog.to = peer.id
    sendTextDialog.text = ''
    sendTextDialog.show = true
    nextTick(() => {
      // Focus handled by vuetify autofocus prop on textarea
    })
  }
  let touchStart = 0
  let touchTimer: any = null
  function onTouchStart (_peer: PeerInfo) {
    touchStart = Date.now()
    clearTimeout(touchTimer)
    touchTimer = setTimeout(() => onRightClick(_peer), 610)
  }
  function onTouchEnd (e: TouchEvent, _peer: PeerInfo) {
    if (Date.now() - touchStart < 500) {
      clearTimeout(touchTimer)
    } else {
      e?.preventDefault()
      onRightClick(_peer)
    }
  }

  // Dialog actions
  function closeReceiveDialog () {
    if (receiveDialog.previewUrl) URL.revokeObjectURL(receiveDialog.previewUrl)
    if (receiveDialog.downloadUrl) URL.revokeObjectURL(receiveDialog.downloadUrl)
    receiveDialog.previewUrl = ''
    receiveDialog.downloadUrl = ''
    receiveDialog.file = null
    receiveDialog.show = false
  }
  function onSaveClick () {
    if (!(window as any).isDownloadSupported) return
    // Keep dialog open only if askBeforeDownload is true
    if (!receiveDialog.askBeforeDownload) closeReceiveDialog()
  }
  function sendText () {
    if (!sendTextDialog.to) return
    _peersManager?.sendText(sendTextDialog.to, sendTextDialog.text)
    sendTextDialog.show = false
  }
  async function copyReceivedText () {
    await navigator.clipboard.writeText(receiveTextDialog.text)
    onNotify('Copied to clipboard')
  }

  // Events wiring
  function onPeers (list: PeerInfo[]) {
    peers.splice(0, peers.length, ...list.map(p => ({ ...p })))
  }
  function onPeerJoined (peer: PeerInfo) {
    if (!peers.some(p => p.id === peer.id)) peers.push({ ...peer })
  }
  function onPeerLeft (peerId: string) {
    const idx = peers.findIndex(p => p.id === peerId)
    if (idx !== -1) peers.splice(idx, 1)
  }
  function onFileProgress (data: { sender?: string, recipient?: string, progress: number }) {
    const id = (data.sender || data.recipient) as string
    progress[id] = data.progress
    ;(transferById as any)[id] = data.progress > 0 && data.progress < 1
    if (data.progress >= 1) (transferById as any)[id] = false
  }
  function onFileReceived (file: { name: string, size: number, mime: string, blob: Blob }) {
    const url = URL.createObjectURL(file.blob)
    receiveDialog.file = file as any
    receiveDialog.downloadUrl = url
    receiveDialog.previewUrl = isImage(file.mime) ? url : ''
    if ((window as any).isDownloadSupported && !receiveDialog.askBeforeDownload) {
      // auto download
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      // show toast and clear
      onNotify('File transfer completed.')
      return
    }
    receiveDialog.show = true
  }
  function onTextReceived (payload: { text: string }) {
    receiveTextDialog.text = payload.text
    receiveTextDialog.show = true
  }
  function onDisplayName (msg: any) {
    const me = (msg as any).message
    displayName.value = 'You are known as ' + me.displayName
    deviceNameTitle.value = me.deviceName
  }
  function onNotify (message: string) {
    snackbar.message = message
    snackbar.show = true
  }

  // Join/QR helpers
  function currentRoomUrl () {
    const room = joinRoomDialog.room.trim()
    const base = `${location.protocol}//${location.host}`
    return room ? `${base}?room=${encodeURIComponent(room)}` : base
  }
  function renderQr () {
    const container = qrContainer.value
    if (!container) return
    container.innerHTML = ''
    try {
      qrCodeInstance = new QRCode(currentRoomUrl(), {
        type: 4,
        correctionLevel: 'Q',
        size: 240,
        colorDark: '#000000',
        colorLight: '#ffffff',
      })
      qrCodeInstance.renderTo(SVG(container))
    } catch {
      console.error('Failed to render QR code')
      // remove last character
      joinRoomDialog.room = joinRoomDialog.room.slice(0, -1)
    }
  }
  function openJoinRoom () {
    joinRoomDialog.show = true
    nextTick(() => renderQr())
  }
  function submitJoinRoom () {
    window.location.href = currentRoomUrl()
  }
  watch(() => joinRoomDialog.room, () => renderQr())

  // Paste handler (send pasted image to the only peer)
  function onPaste (e: ClipboardEvent) {
    const items = e.clipboardData?.items
    if (!items) return
    const files = Array.from(items)
      .filter(i => i.type.includes('image'))
      .map(i => i.getAsFile())
      .filter(Boolean) as File[]
    if (files.length > 0 && peers.length === 1) {
      const onlyPeer = peers[0] as PeerInfo
      _peersManager?.sendFiles(onlyPeer.id, files)
    }
  }

  // Background animation
  function setupBackgroundAnimation () {
    const existingCanvas = document.querySelector('#background-canvas') as HTMLCanvasElement | null
    if (existingCanvas) return

    const c = document.createElement('canvas')
    c.id = 'background-canvas'
    document.body.append(c)
    const style = c.style as CSSStyleDeclaration
    style.width = '100%'
    style.zIndex = '-1'
    style.position = 'absolute'
    style.top = '0'
    style.left = '0'
    const ctx = c.getContext('2d')!
    let x0 = 0, y0 = 0, w = 0, h = 0, dw = 0
    function drawCircle (radius: number) {
      ctx.beginPath()
      const color = Math.round(197 * (1 - radius / Math.max(w, h)))
      ctx.strokeStyle = `rgba(${color},${color},${color},0.1)`
      ctx.arc(x0, y0, radius, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.lineWidth = 2
    }
    let step = 0
    function drawCircles () {
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < 8; i++) {
        drawCircle(dw * i + (step % dw))
      }
      step += 1
    }
    const loading = true
    function animate () {
      if (loading || step % dw < dw - 5) {
        requestAnimationFrame(() => {
          drawCircles()
          animate()
        })
      }
    }
    function init () {
      w = window.innerWidth
      h = window.innerHeight
      c.width = w
      c.height = h
      let offset = h > 380 ? 100 : 65
      offset = h > 800 ? 116 : offset
      x0 = w / 2
      y0 = h - offset
      dw = Math.max(w, h, 1000) / 13
      drawCircles()
    }
    window.addEventListener('resize', init)
    init()
    animate()
  }

  // Init connection and listeners
  let server: any
  let _peersManager: any
  const listeners: Array<{ type: string, handler: any }> = []

  function addListener (type: string, handler: any) {
    const wrapper = (e: any) => handler(e.detail ?? e)
    window.addEventListener(type, wrapper)
    listeners.push({ type, handler: wrapper })
  }

  onMounted(() => {
    // Prefill room from URL
    try {
      const params = new URLSearchParams(location.search)
      const room = params.get('room')
      joinRoomDialog.room = room ? decodeURIComponent(room) : crypto.randomUUID().split('-')[0]
    } catch {}
    // Init network stack
    server = new ServerConnection()
    _peersManager = new PeersManager(server)

    // Listeners
    addListener('peers', onPeers)
    addListener('peer-joined', onPeerJoined)
    addListener('peer-left', onPeerLeft)
    addListener('file-progress', onFileProgress)
    addListener('file-received', onFileReceived)
    addListener('text-received', onTextReceived)
    addListener('display-name', onDisplayName)
    addListener('notify-user', onNotify)

    // Network status notifications
    window.addEventListener('offline', () => onNotify('You are offline'))
    window.addEventListener('online', () => onNotify('You are back online'))

    // Global paste and DnD prevent default
    window.addEventListener('paste', onPaste)
    window.addEventListener('dragover', e => e.preventDefault())
    window.addEventListener('drop', e => e.preventDefault())

    // Background animation
    setupBackgroundAnimation()
  })

  onBeforeUnmount(() => {
    for (const l of listeners) {
      window.removeEventListener(l.type, l.handler)
    }
    window.removeEventListener('paste', onPaste)
  })
</script>

<style>
body {
  background-color: rgb(var(--v-theme-background)) !important;
}

.v-application {
  background: none;
}
</style>
