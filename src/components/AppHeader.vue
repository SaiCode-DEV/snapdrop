<template>
  <v-container class="mx-auto d-flex align-center justify-center">
    <v-btn
      v-for="link in links"
      :key="link.href"
      :text="link.text"
      :to="link.href"
      variant="text"
    />

    <v-spacer />
    <RouterLink v-slot="{ isActive }" custom to="/about">
      <v-icon-btn :active="isActive" icon="mdi-information-outline" tag="a" @click="aboutTogggle" />
    </RouterLink>

    <v-icon-btn
      id="notification"
      hidden
      icon="mdi-bell-outline"
      title="Enable Notifications"
    />
    <v-icon-btn
      id="settings"
      icon="mdi-cog"
      title="Settings"
    />
    <v-icon-btn
      id="install"
      hidden
      icon="mdi-home"
      title="Install Snapdrop"
    />
  </v-container>
</template>

<script lang="ts" setup>
  import { useRoute, useRouter } from 'vue-router'
  const router = useRouter()
  const route = useRoute()

  function aboutTogggle () {
    if (route.path === '/about') {
      router.back()
    } else {
      router.push('/about')
    }
  }

  const links = [
    {
      text: 'Home',
      href: '/',
    },
    {
      text: 'About',
      href: '/about',
    },
    {
      text: 'Contact',
      href: '/contact',
    },
  ]

</script>
