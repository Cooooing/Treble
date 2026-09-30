<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { defaultTheme, isDarkTheme, type Theme } from "@/utils/theme";
import type Vditor from "vditor";
import "vditor/dist/index.css";

type IOptions = import("vditor").IOptions;

let sequence = 0;

const props = withDefaults(
  defineProps<{
    id?: string;
    name?: string;
    height?: IOptions["height"];
    width?: IOptions["width"];
    options?: IOptions;
    modelValue?: string;
  }>(),
  {
    height: "500px",
    width: "100%",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:vditorInstance", value: Vditor): void;
}>();

const vditor = ref<Vditor>();
const vditorRef = ref<HTMLDivElement>();
const editorReady = ref(false);
const theme = ref<Theme>(defaultTheme);
const editorId = props.id || `editor-${++sequence}`;
let disposed = false;

function syncTheme(nextTheme: Theme) {
  theme.value = nextTheme;
  if (editorReady.value) {
    vditor.value?.setTheme(isDarkTheme(nextTheme) ? "dark" : "classic");
  }
}

function handleThemeChange(event: Event) {
  syncTheme((event as CustomEvent<Theme>).detail);
}

onMounted(async () => {
  theme.value = document.documentElement.dataset.theme === "dark" ? "dark" : defaultTheme;
  window.addEventListener("treble-theme-change", handleThemeChange);

  // Vditor accesses browser globals as soon as its module is evaluated. The
  // editor is client-only, but its parent participates in article SSR, so load
  // Vditor only after Vue has mounted in a browser.
  const VditorConstructor = (await import("vditor")).default;
  if (disposed || !vditorRef.value) return;

  const { after, cache, input, preview, resize, ...options } = props.options || {};
  vditor.value = new VditorConstructor(vditorRef.value, {
    outline: { enable: false, position: "left" },
    typewriterMode: false,
    cache: {
      enable: Boolean(props.name),
      id: props.name || editorId,
      ...cache,
    },
    preview: { delay: 500, mode: "both", ...preview },
    resize: { enable: false, ...resize },
    lang: "zh_CN",
    height: props.height,
    width: props.width,
    ...options,
    theme: isDarkTheme(theme.value) ? "dark" : "classic",
    after: () => {
      const value = props.modelValue;
      if (value !== undefined && vditor.value?.getValue() !== value) {
        vditor.value?.setValue(value);
      }
      editorReady.value = true;
      syncTheme(theme.value);
      after?.();
    },
    input: (value) => {
      emit("update:modelValue", value);
      input?.(value);
    },
  });
  emit("update:vditorInstance", vditor.value);
});

watch(
  () => props.modelValue,
  (value) => {
    if (!editorReady.value || value === undefined || vditor.value?.getValue() === value) return;
    vditor.value?.setValue(value);
  },
);

onUnmounted(() => {
  disposed = true;
  window.removeEventListener("treble-theme-change", handleThemeChange);
  vditor.value?.destroy();
  vditor.value = undefined;
});

defineExpose({
  vditor,
  getValue() {
    return vditor.value?.getValue() || "";
  },
  setValue(value: string) {
    vditor.value?.setValue(value);
  },
  focus() {
    vditor.value?.focus();
  },
  clearCache() {
    if (props.name) {
      vditor.value?.clearCache();
    }
  },
});
</script>

<template>
  <section :aria-busy="!editorReady" :inert="editorReady ? undefined : ''" class="editor-shell">
    <div :id="editorId" ref="vditorRef" :style="{ height, width }" />
    <div v-if="!editorReady" aria-live="polite" class="editor-shell__loading" role="status">
      <span aria-hidden="true" class="editor-shell__spinner" />
      正在加载编辑器...
    </div>
  </section>
</template>

<style scoped>
.editor-shell {
  position: relative;
  min-width: 0;
  background: var(--layer-background-color);
}

.editor-shell :deep(.vditor) {
  border: 0;
  border-radius: 0;
  background: var(--layer-background-color);
}

.editor-shell :deep(.vditor-toolbar) {
  border-bottom-color: var(--layer-border-color);
  background: var(--background-secondary-color);
}

.editor-shell :deep(.vditor-toolbar__item:hover),
.editor-shell :deep(.vditor-toolbar__item--current),
.editor-shell :deep(.vditor-toolbar__item .vditor-tooltipped:focus-visible) {
  background: transparent;
}

.editor-shell :deep(.vditor-toolbar__item:hover .vditor-tooltipped),
.editor-shell :deep(.vditor-toolbar__item--current .vditor-tooltipped),
.editor-shell :deep(.vditor-toolbar__item .vditor-tooltipped:focus-visible) {
  background: transparent;
  color: var(--toc-hover-color);
  outline: 0;
}

.editor-shell :deep(.vditor-toolbar__item:hover svg),
.editor-shell :deep(.vditor-toolbar__item--current svg),
.editor-shell :deep(.vditor-toolbar__item .vditor-tooltipped:focus-visible svg) {
  color: inherit;
  fill: currentColor;
}

.editor-shell :deep(.vditor-content),
.editor-shell :deep(.vditor-wysiwyg),
.editor-shell :deep(.vditor-ir),
.editor-shell :deep(.vditor-sv) {
  background: var(--layer-background-color);
  color: var(--text-color);
}

.editor-shell :deep(.vditor-wysiwyg),
.editor-shell :deep(.vditor-ir),
.editor-shell :deep(.vditor-sv) {
  padding: 16px 18px;
}

.editor-shell :deep(.vditor-wysiwyg[placeholder]::before),
.editor-shell :deep(.vditor-ir pre.vditor-reset[placeholder]::before),
.editor-shell :deep(.vditor-sv textarea::placeholder) {
  color: var(--text-fade-color);
  opacity: 1;
}

.editor-shell__loading {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 120px;
  background: var(--layer-background-color);
  color: var(--text-fade-color);
  font-size: 14px;
  pointer-events: auto;
}

.editor-shell__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--layer-border-color);
  border-top-color: var(--toc-hover-color);
  border-radius: 50%;
  animation: editor-spin 0.7s linear infinite;
}

@keyframes editor-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .editor-shell__spinner {
    animation: none;
  }
}
</style>
