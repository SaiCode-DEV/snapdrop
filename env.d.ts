/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />
/// <reference types="vite-plugin-vue-layouts-next/client" />

declare module '@/scripts/network.js' {
  export class ServerConnection {
    constructor ()
  }
  export class PeersManager {
    constructor (server: ServerConnection)
    sendFiles (to: string, files: FileList | File[] | Iterable<File>): void
    sendText (to: string, text: string): void
  }
}
