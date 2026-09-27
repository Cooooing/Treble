<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import logoAnimationUrl from "@/assets/site/logo-animation.js?url";
import Icon from "@/components/community/Icon.vue";

declare global {
  interface Window {
    __moyuLogoData?: Record<string, unknown>;
  }
}

const element = ref<HTMLElement>();
const animationUnavailable = ref(false);
const animationReady = ref(false);
type LottiePlayer = typeof import("lottie-web");
let animation: ReturnType<LottiePlayer["loadAnimation"]> | undefined;
let animationDataPromise: Promise<Record<string, unknown>> | undefined;

function loadAnimationData() {
  if (window.__moyuLogoData) return Promise.resolve(window.__moyuLogoData);
  if (animationDataPromise) return animationDataPromise;

  animationDataPromise = new Promise<Record<string, unknown>>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = logoAnimationUrl;
    script.onload = () => window.__moyuLogoData ? resolve(window.__moyuLogoData) : reject(new Error("站点标识动画数据无效。"));
    script.onerror = () => reject(new Error("站点标识动画加载失败。"));
    document.head.appendChild(script);
  });
  return animationDataPromise;
}

async function initialize() {
  if (!element.value) return;
  const animationData = await loadAnimationData();
  const { default: lottie } = await import("lottie-web");
  animation = lottie.loadAnimation({
    container: element.value,
    renderer: "svg",
    loop: false,
    autoplay: false,
    animationData,
  });
  animation.goToAndPlay(27, true);
  animationReady.value = true;
}

function replay() {
  animation?.goToAndPlay(10, true);
}

onMounted(() => {
  initialize().catch((error: unknown) => {
    animationUnavailable.value = true;
    console.error("摸鱼派标识动画加载失败", error);
  });
});

onBeforeUnmount(() => animation?.destroy());
</script>

<template>
  <div ref="element" class="brand-mark" aria-hidden="true" @mouseenter="replay">
    <Icon v-if="!animationReady || animationUnavailable" class="brand-mark__fallback" name="logo" />
  </div>
</template>

<style scoped>
.brand-mark {
  display: grid;
  place-items: center;
  width: 55px;
  height: 55px;
  padding-bottom: 6px;
}
.brand-mark__fallback { width: 38px; height: 38px; }
</style>
