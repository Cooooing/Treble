<!-- https://vike.dev/Layout -->

<template>
  <div v-html="svg" style="display:none"></div>
  <component v-if="Layout" :is="Layout">
    <slot></slot>
  </component>
</template>

<script lang="ts" setup>
  import svg from 'virtual:svg-icons-ssr-html'
  import type { Data } from "./+data";
  import { useData } from "vike-vue/useData";

  const { theme } = useData<Data>();
  const Layout = ref<any>();
  
  async function loadTheme() {
    Layout.value = await import(`@/theme/${theme}/index.vue`).then(m => m.default);
  }

  loadTheme()
</script>


<style scoped>

</style>
