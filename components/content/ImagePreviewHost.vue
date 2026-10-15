<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { closeImagePreview, imagePreviewAlt, imagePreviewSrc, openImagePreview } from "@/services/imagePreview";

const PREVIEW_ATTRIBUTE = "data-image-preview";
const MIN_SCALE = 0.25;
const MAX_SCALE = 6;
const WHEEL_STEP = 1.12;

const scale = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
let previousBodyOverflow = "";
let panState:
  | {
      startX: number;
      startY: number;
      originX: number;
      originY: number;
    }
  | undefined;

const zoomLabel = computed(() => `${Math.round(scale.value * 100)}%`);
const imageStyle = computed(() => ({
  cursor: scale.value > 1 ? "grab" : "zoom-in",
  transform: `translate3d(${offsetX.value}px, ${offsetY.value}px, 0) scale(${scale.value})`,
}));

function resetView() {
  scale.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
}

function handleWheel(event: WheelEvent) {
  event.preventDefault();
  const factor = event.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP;
  scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value * factor));
  if (scale.value <= 1) {
    offsetX.value = 0;
    offsetY.value = 0;
  }
}

function handleImageMouseDown(event: MouseEvent) {
  if (scale.value <= 1) return;
  event.preventDefault();
  panState = {
    startX: event.clientX,
    startY: event.clientY,
    originX: offsetX.value,
    originY: offsetY.value,
  };
  document.addEventListener("mousemove", handlePanMove);
  document.addEventListener("mouseup", handlePanEnd);
}

function handlePanMove(event: MouseEvent) {
  if (!panState) return;
  offsetX.value = panState.originX + event.clientX - panState.startX;
  offsetY.value = panState.originY + event.clientY - panState.startY;
}

function handlePanEnd() {
  panState = undefined;
  document.removeEventListener("mousemove", handlePanMove);
  document.removeEventListener("mouseup", handlePanEnd);
}

function handleDoubleClick() {
  if (scale.value > 1) {
    resetView();
    return;
  }
  scale.value = 2;
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  const image = target?.closest("img");
  if (!image || image.classList.contains("emoji") || image.closest("[data-no-image-preview]")) return;
  if (!image.closest(`[${PREVIEW_ATTRIBUTE}]`)) return;

  const src = image.currentSrc || image.getAttribute("src");
  if (!src) return;

  event.preventDefault();
  openImagePreview(src, image.getAttribute("alt") || "");
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") closeImagePreview();
}

watch(imagePreviewSrc, (src) => {
  if (typeof document === "undefined") return;
  if (src) {
    resetView();
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return;
  }
  document.body.style.overflow = previousBodyOverflow;
});

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
  document.removeEventListener("keydown", handleKeydown);
  handlePanEnd();
  document.body.style.overflow = previousBodyOverflow;
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="imagePreviewSrc"
      aria-label="图片预览"
      aria-modal="true"
      class="image-preview"
      role="dialog"
      @click.self="closeImagePreview"
      @wheel.prevent="handleWheel"
    >
      <button aria-label="关闭图片预览" class="image-preview__close" type="button" @click="closeImagePreview">×</button>
      <img
        :alt="imagePreviewAlt"
        :src="imagePreviewSrc"
        :style="imageStyle"
        class="image-preview__image"
        @click.stop
        @dblclick="handleDoubleClick"
        @mousedown="handleImageMouseDown"
      />
      <span class="image-preview__zoom">{{ zoomLabel }}</span>
    </div>
  </Teleport>
</template>

<style scoped>
.image-preview {
  position: fixed;
  z-index: 10030;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(15, 23, 42, 0.88);
  box-sizing: border-box;
  animation: image-preview-in 0.16s ease-out;
}

.image-preview__image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
  will-change: transform;
  user-select: none;
}

.image-preview__close {
  position: absolute;
  top: 18px;
  right: 18px;
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.5);
  color: #fff;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.image-preview__close:hover,
.image-preview__close:focus-visible {
  background: rgba(255, 255, 255, 0.18);
  outline: none;
}

.image-preview__zoom {
  position: absolute;
  bottom: 18px;
  left: 50%;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.58);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  transform: translateX(-50%);
}

@keyframes image-preview-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .image-preview {
    padding: 14px;
  }
  .image-preview__close {
    top: 10px;
    right: 10px;
  }
}
</style>
