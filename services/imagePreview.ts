import { ref } from "vue";

export const imagePreviewSrc = ref<string>();
export const imagePreviewAlt = ref("");

export function openImagePreview(src: string, alt = ""): void {
  if (!src) return;
  imagePreviewSrc.value = src;
  imagePreviewAlt.value = alt;
}

export function closeImagePreview(): void {
  imagePreviewSrc.value = undefined;
  imagePreviewAlt.value = "";
}
