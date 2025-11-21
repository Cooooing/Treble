<script lang="ts" setup>
  import { useDaisyUI } from '@/stores/useDaisyUI';
  import Vditor from 'vditor';
  import 'vditor/dist/index.css';
  import { ref, onMounted } from 'vue';

  const vditor = ref<Vditor>();
  const daisyuiTheme = useDaisyUI();
  onMounted(() => {
    vditor.value = new Vditor('vditor', {
      height: '70vh',
      width: '100vw',
      theme: daisyuiTheme.isDarkTheme ? 'dark' : 'classic',
    });
  });

  watch(() => daisyuiTheme.isDarkTheme, (newVal) => {
    if (vditor.value) {
      vditor.value.setTheme(newVal ? 'dark' : 'classic');
    }
  }, { immediate: true });
</script>
<template>
 <div id="vditor">
  <div class="h-[70vh] flex items-center justify-center"><span class="loading loading-infinity loading-xl"></span></div>
 </div>
</template>