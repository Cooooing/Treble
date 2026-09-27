<template>
  <link rel="icon" :href="logoUrl" />
  <link rel="preload" :href="iconsUrl" as="script" />
  <component :is="'script'" :src="iconsUrl" defer />
  <script v-html="themeScript"></script>
</template>

<script setup lang="ts">
import "@/assets/site/styles/site.css";
import iconsUrl from "@/assets/site/icons.js?url";
import logoUrl from "@/assets/site/images/favicon.png";
const themeScript = `(()=>{try{const theme=localStorage.getItem("treble.theme");document.documentElement.dataset.theme=theme==="dark"?"dark":"light";document.cookie="treble.theme=; Max-Age=0; Path=/; SameSite=Lax"}catch{document.documentElement.dataset.theme="light"}})();`;
</script>
