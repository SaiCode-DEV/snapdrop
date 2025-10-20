<template>
  <v-container id="about">
    <section class="center column fade-in">
      <header class="row-reverse">
        <a class="close icon-button" href="/">
          <v-icon icon="mdi-close" />
        </a>
      </header>
      <v-icon icon="mdi-wifi-tethering" />
      <h1>Snapdrop</h1>
      <div class="font-subheading">The easiest way to transfer files across devices</div>
      <div class="row">
        <a
          class="icon-button"
          href="https://github.com/RobinLinus/snapdrop"
          rel="noreferrer"
          target="_blank"
          title="Snapdrop on Github"
        >
          <v-icon icon="mdi-github" />
        </a>
        <a
          class="icon-button"
          href="https://www.paypal.com/donate?hosted_button_id=FTP9DXUR7LA7Q"
          rel="noreferrer"
          target="_blank"
          title="Help cover the server costs!"
        >
          <v-icon icon="mdi-currency-usd" />
        </a>
        <a
          class="icon-button"
          href="https://twitter.com/intent/tweet?text=https://snapdrop.net%20by%20@robin_linus%20&"
          rel="noreferrer"
          target="_blank"
          title="Tweet about Snapdrop"
        >
          <v-icon icon="mdi-twitter" />
        </a>
        <a
          class="icon-button"
          href="https://github.com/RobinLinus/snapdrop/blob/master/docs/faq.md"
          rel="noreferrer"
          target="_blank"
          title="Frequently asked questions"
        >
          <v-icon icon="mdi-help-outline" />
        </a>
      </div>
    </section>
    <x-background />
  </v-container>
</template>

<script lang="ts" setup>
  import '@/styles/legacy.css'
</script>
