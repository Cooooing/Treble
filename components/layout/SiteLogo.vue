<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import logoAnimationUrl from "@/assets/site/logo-animation.js?url";

declare global {
  interface Window {
    __moyuLogoData?: Record<string, unknown>;
  }
}

const container = ref<HTMLElement>();
type LottiePlayer = typeof import("lottie-web");
let animation: ReturnType<LottiePlayer["loadAnimation"]> | undefined;

async function loadAnimationData() {
  if (window.__moyuLogoData) return window.__moyuLogoData;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = logoAnimationUrl;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("站点标识动画加载失败。"));
    document.head.appendChild(script);
  });
  if (!window.__moyuLogoData) throw new Error("站点标识动画数据无效。");
  return window.__moyuLogoData;
}

onMounted(async () => {
  if (!container.value) return;
  try {
    const [animationData, { default: lottie }] = await Promise.all([loadAnimationData(), import("lottie-web")]);
    animation = lottie.loadAnimation({
      container: container.value,
      renderer: "svg",
      loop: false,
      autoplay: true,
      animationData,
    });
  } catch (error) {
    console.error("摸鱼派标识动画加载失败", error);
  }
});

onBeforeUnmount(() => animation?.destroy());
</script>

<template>
  <span ref="container" aria-hidden="true" class="site-logo" />
</template>

<style scoped>
.site-logo {
  display: block;
  width: 55px;
  height: 55px;
}
</style>
