<script setup lang="ts">
  import { Vue3Lottie } from 'vue3-lottie'
  import { logoData } from '../animation'

  const logoRef = ref<InstanceType<typeof Vue3Lottie>>();
  const title = import.meta.env.VITE_GLOB_APP_TITLE;
</script>
<template>
  <a href="/" @mouseover="logoRef?.play()" class="inline-flex items-center space-x-0 text-base">
    <client-only>
      <Vue3Lottie
        ref="logoRef"
        :animationData="logoData"
        :height="55"
        :width="55"
        :loop="false"
        renderer="svg"
      />
    </client-only>
    <span>{{ title }}</span>
  </a>
</template>