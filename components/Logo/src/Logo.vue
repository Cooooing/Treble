<script setup lang="ts">
  import { clientOnly } from 'vike-vue/clientOnly';
  import { Vue3Lottie } from 'vue3-lottie'
  import { logoData } from '../animation'

  const logoRef = ref<InstanceType<typeof Vue3Lottie>>();
  const title = import.meta.env.VITE_GLOB_APP_TITLE;
  const reload = ref(false);
  function replayLogo() {
    reload.value = true;
    setTimeout(() => {
      reload.value = false;
    }, 0);
  }
  const Vue3LottieClientOnly = clientOnly(() => import('vue3-lottie').then(module => module.Vue3Lottie));
</script>
<template>
  <a href="/" @mouseenter="replayLogo" class="inline-flex items-center space-x-0 text-inherit">
    <span class="w-[55px] h-[55px]">
      <Vue3LottieClientOnly
        v-if="!reload"
        ref="logoRef"
        :animationData="logoData"
        :height="55"
        :width="55"
        :loop="false"
        renderer="svg"
      />
    </span>
    <span class="hidden md:inline">{{ title }}</span>
  </a>
</template>