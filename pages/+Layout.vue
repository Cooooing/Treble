<!-- https://vike.dev/Layout -->

<template>
  <div v-html="svg" style="display:none"></div>
  <component v-if="Layout" :is="Layout">
    <slot></slot>
  </component>
</template>

<script lang="ts" setup>
  import { usePageContext } from 'vike-vue/usePageContext';
  import svg from 'virtual:svg-icons-ssr-html'

  const page = usePageContext();
  const Layout = ref<any>();
  
  async function loadTheme() {
    Layout.value = await import(`@/theme/${page.user?.theme || 'default'}/index.vue`).then(m => m.default);
  }

  loadTheme()
</script>


<style scoped>

</style>
