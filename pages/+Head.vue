<template>
  <link rel="icon" :href="logoUrl" />
  <script v-html="themeScript"></script>
</template>

<script setup lang="ts">
import "@/assets/site/styles/site.css";
import logoUrl from "@/assets/site/images/favicon.png";
const themeScript = `(()=>{try{const theme=localStorage.getItem("treble.theme");document.documentElement.dataset.theme=theme==="dark"?"dark":"light";document.cookie="treble.theme=; Max-Age=0; Path=/; SameSite=Lax"}catch{document.documentElement.dataset.theme="light"}})();`;
</script>
