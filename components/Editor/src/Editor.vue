<script lang="ts" setup>
  import { useDaisyui } from '@/hooks/useDaisyui';
  import Vditor from 'vditor';
  import 'vditor/dist/index.css';
  import { ref, onMounted } from 'vue';

  const vditor = ref<Vditor>();
  const { isDaisyDark, isDarkTheme } = useDaisyui();
  onMounted(() => {
    vditor.value = new Vditor('vditor', {
      height: '70vh',
      width: '100vw',
      theme: isDarkTheme.value ? 'dark' : 'classic',
    });
  });

  watch(isDaisyDark, (newVal) => {
    if (vditor.value) {
      vditor.value.setTheme(newVal ? 'dark' : 'classic');
    }
  }, { immediate: true });
</script>
<template>
 <div id="vditor"></div>
</template>