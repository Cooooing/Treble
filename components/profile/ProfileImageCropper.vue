<script lang="ts" setup>
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import { computed, nextTick, onBeforeUnmount, ref } from "vue";

const props = defineProps<{ purpose: "avatar" | "background" }>();
const emit = defineEmits<{ ready: [value: { content: Uint8Array; fileName: string; mimeType: string }] }>();

const input = ref<HTMLInputElement>();
const cropImage = ref<HTMLImageElement>();
const preview100 = ref<HTMLElement>();
const preview50 = ref<HTMLElement>();
const preview30 = ref<HTMLElement>();
const file = ref<File>();
const sourceURL = ref("");
const cropper = ref<Cropper>();
const error = ref("");
const isGIF = computed(() => file.value?.type === "image/gif");
const ratio = computed(() => (props.purpose === "avatar" ? 1 : 3));
const output = computed(() =>
  props.purpose === "avatar" ? { width: 512, height: 512 } : { width: 1500, height: 500 },
);
const outputLabel = computed(() => `${output.value.width} × ${output.value.height}`);
const label = computed(() => (props.purpose === "avatar" ? "头像" : "背景图"));

function destroyCropper() {
  cropper.value?.destroy();
  cropper.value = undefined;
}

async function initializeCropper() {
  await nextTick();
  if (!cropImage.value || isGIF.value) return;
  destroyCropper();
  cropper.value = new Cropper(cropImage.value, {
    aspectRatio: ratio.value,
    // The background editor has enough room to start with an almost full-width frame.
    // Avatars retain a little surrounding context for easier composition.
    autoCropArea: props.purpose === "background" ? 1 : 0.9,
    background: false,
    // Keep the ratio fixed while allowing the same eight resize handles and frame movement
    // provided by Rhythm's Cropper.js editor.
    cropBoxMovable: true,
    cropBoxResizable: true,
    dragMode: "move",
    guides: true,
    modal: true,
    preview:
      props.purpose === "avatar"
        ? [preview100.value, preview50.value, preview30.value].filter((item): item is HTMLElement => Boolean(item))
        : undefined,
    responsive: true,
    viewMode: 1,
    zoomOnWheel: true,
  });
}

function clearSelection() {
  destroyCropper();
  if (sourceURL.value) URL.revokeObjectURL(sourceURL.value);
  sourceURL.value = "";
  file.value = undefined;
  if (input.value) input.value.value = "";
}

async function choose(event: Event) {
  const next = (event.target as HTMLInputElement).files?.[0];
  if (!next) return;
  error.value = "";
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(next.type)) {
    error.value = "仅支持 JPEG、PNG、WebP 或 GIF 图片。";
    return;
  }
  if (next.size > 2 * 1024 * 1024) {
    error.value = "图片不能超过 2 MiB。";
    return;
  }
  clearSelection();
  file.value = next;
  sourceURL.value = URL.createObjectURL(next);
  await initializeCropper();
}

function openPicker() {
  input.value?.click();
}

function zoom(delta: number) {
  cropper.value?.zoom(delta);
}

function move(event: KeyboardEvent) {
  if (!cropper.value || event.altKey || event.ctrlKey || event.metaKey) return;
  const step = event.shiftKey ? 10 : 1;
  const changes: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0],
    ArrowUp: [0, -step],
    ArrowRight: [step, 0],
    ArrowDown: [0, step],
  };
  const change = changes[event.key];
  if (!change) return;
  event.preventDefault();
  cropper.value.move(...change);
}

async function crop() {
  if (!file.value) return;
  if (isGIF.value) {
    // Canvas serializes a GIF to its first frame. Upload its original bytes to retain animation.
    emit("ready", {
      content: new Uint8Array(await file.value.arrayBuffer()),
      fileName: file.value.name,
      mimeType: "image/gif",
    });
    return;
  }
  const canvas = cropper.value?.getCroppedCanvas({ width: output.value.width, height: output.value.height });
  if (!canvas) {
    error.value = "无法裁切该图片，请重新选择。";
    return;
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
  if (!blob) {
    error.value = "无法生成裁切后的图片，请重新选择。";
    return;
  }
  emit("ready", {
    content: new Uint8Array(await blob.arrayBuffer()),
    fileName: `${props.purpose}.webp`,
    mimeType: "image/webp",
  });
}

onBeforeUnmount(clearSelection);
</script>

<template>
  <section :class="`cropper--${purpose}`" class="cropper">
    <input ref="input" accept="image/jpeg,image/png,image/webp,image/gif" type="file" @change="choose" />
    <div class="cropper__topline">
      <button type="button" @click="openPicker">选择{{ label }}</button>
      <p v-if="purpose === 'avatar'" class="cropper__notice">禁止使用任何涉嫌非法或者敏感图片作为头像</p>
      <p v-else class="cropper__notice">禁止上传任何涉嫌非法或敏感内容的背景图。</p>
    </div>

    <template v-if="file">
      <div v-if="isGIF" :class="{ 'cropper__gif-preview--avatar': purpose === 'avatar' }" class="cropper__gif-preview">
        <img :alt="`${label}动图预览`" :src="sourceURL" />
      </div>
      <div v-else class="cropper__editor" @keydown="move">
        <div :aria-label="`拖动以调整${label}裁切区域，方向键可微调`" class="cropper__viewport" tabindex="0">
          <img ref="cropImage" :alt="`${label}裁切编辑器`" :src="sourceURL" />
        </div>
        <aside v-if="purpose === 'avatar'" aria-label="头像尺寸预览" class="cropper__previews">
          <div ref="preview100" class="cropper__preview cropper__preview--100" />
          <span>100 × 100</span>
          <div ref="preview50" class="cropper__preview cropper__preview--50" />
          <span>50 × 50</span>
          <div ref="preview30" class="cropper__preview cropper__preview--30" />
          <span>30 × 30</span>
        </aside>
      </div>
      <div v-if="!isGIF" aria-label="裁切缩放控制" class="cropper__tools">
        <button aria-label="缩小图片" type="button" @click="zoom(-0.1)">−</button>
        <span>拖动图片调整位置，滚轮或按钮缩放</span>
        <button aria-label="放大图片" type="button" @click="zoom(0.1)">+</button>
      </div>
      <div class="cropper__actions">
        <button type="button" @click="openPicker">重选</button>
        <button class="green" type="button" @click="crop">确认上传</button>
      </div>
    </template>

    <p v-if="error" class="cropper__error" role="alert">{{ error }}</p>
    <p class="cropper__help">
      JPEG、PNG、WebP 或 GIF，最大 2 MiB；静态图裁切后为 {{ outputLabel }}，GIF 将直接上传以保留动画。
    </p>
  </section>
</template>

<style scoped>
.cropper {
  display: grid;
  gap: 12px;
  min-width: 0;
}
.cropper > input {
  display: none;
}
.cropper__topline,
.cropper__tools,
.cropper__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.cropper__topline button,
.cropper__tools button,
.cropper__actions button {
  margin: 0 !important;
  min-height: 36px;
}
.cropper__notice,
.cropper__help,
.cropper__error {
  margin: 0;
  font-size: 13px;
  line-height: 20px;
}
.cropper__notice {
  color: var(--text-gray-color);
}
.cropper__help {
  color: var(--text-fade-color);
}
.cropper__error {
  color: #b94646;
}
.cropper__editor {
  display: flex;
  align-items: center;
  gap: 24px;
  min-width: 0;
}
.cropper__viewport {
  position: relative;
  width: 100%;
  max-width: 720px;
  aspect-ratio: v-bind(ratio);
  overflow: hidden;
  background: var(--background-secondary-color);
  outline: none;
}
.cropper__viewport:focus-visible {
  box-shadow: 0 0 0 3px var(--accent-color, #4285f4);
}
.cropper--avatar .cropper__viewport {
  max-width: 280px;
}
.cropper__viewport > img {
  display: block;
  max-width: 100%;
}
.cropper__previews {
  display: grid;
  justify-items: center;
  gap: 5px;
  color: var(--text-fade-color);
  font-size: 12px;
  text-align: center;
}
.cropper__preview {
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--background-secondary-color);
}
.cropper__preview--100 {
  width: 100px;
  height: 100px;
}
.cropper__preview--50 {
  width: 50px;
  height: 50px;
}
.cropper__preview--30 {
  width: 30px;
  height: 30px;
}
.cropper__tools {
  color: var(--text-gray-color);
  font-size: 13px;
}
.cropper__tools span {
  min-width: 0;
}
.cropper__tools button {
  width: 36px;
  padding: 0;
  font-size: 20px;
  line-height: 1;
}
.cropper__gif-preview {
  display: grid;
  place-items: center;
  max-width: 100%;
  min-height: 160px;
  overflow: hidden;
  background: var(--background-secondary-color);
}
.cropper__gif-preview--avatar {
  width: 280px;
  aspect-ratio: 1;
}
.cropper__gif-preview img {
  display: block;
  max-width: 100%;
  max-height: 360px;
  object-fit: contain;
}
:deep(.cropper-container) {
  font-size: 0;
}
@media (max-width: 600px) {
  .cropper__editor {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }
  .cropper__previews {
    grid-template-columns: auto auto auto;
    align-items: center;
    justify-items: start;
    column-gap: 8px;
  }
  .cropper__previews span {
    margin-right: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  :deep(.cropper-canvas),
  :deep(.cropper-crop-box) {
    transition: none !important;
  }
}
</style>
