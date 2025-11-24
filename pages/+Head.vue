<!-- https://vike.dev/Head -->

<template>
  <link rel="icon" :href="logoUrl" />
  <component is="script">
    document.documentElement.insertAdjacentHTML(`beforeend`, `<input type="checkbox" checked="true" class="theme-controller hidden" value="${
      localStorage.getItem(`theme`) || `fishpi`
    }" />`)
  </component>
</template>

<script setup lang="ts">
import "@/assets/styles/tailwind.css";
import "@/assets/styles/main.less";
import logoUrl from "@/assets/images/logo.svg";
</script>
