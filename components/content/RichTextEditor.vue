<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { defaultTheme, isDarkTheme, type Theme } from "@/utils/theme";
import { message } from "@/components/feedback/message";
import { uploadMarkdownImage } from "@/services/markdownImageUpload";
import { bbsClient } from "@/utils/sdk/bbs";
import { loadVditorAssets, lutePath } from "@/utils/vditorAssets";
import type { AccountProfile } from "@bass/bbs-sdk-fetch/models/AccountProfile";
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
    mention?: boolean;
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
const editorError = ref<string>();
const theme = ref<Theme>(defaultTheme);
const editorId = props.id || `editor-${++sequence}`;
let disposed = false;
let lastEditorValue: string | undefined;
const dropActive = ref(false);
const mentionCandidates = ref<AccountProfile[]>([]);

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

  try {
    // Vditor loads both its Chinese copy and Lute from jsDelivr by default. A
    // missing or slow CDN response leaves its `after` callback pending forever.
    // Share the local initialization with Markdown renderers to avoid races.
    const i18n = await loadVditorAssets();

    // Vditor accesses browser globals as soon as its module is evaluated. The
    // editor is client-only, but its parent participates in article SSR, so load
    // Vditor only after Vue has mounted in a browser.
    const VditorConstructor = (await import("vditor")).default;
    if (disposed || !vditorRef.value) return;

    const { after, cache, input, preview, resize, hint, ...options } = props.options || {};
    const mentionHint = props.mention
      ? [
          ...(hint?.extend || []),
          {
            key: "@",
            hint: async (query: string) => {
              const response = await bbsClient.account.searchMention({
                searchMentionAccountsReq: { query, page: { page: 1, size: 5 } },
              });
              mentionCandidates.value = response.rows || [];
              return mentionCandidates.value.map((account) => ({
                value: `[@${account.name}](${account.profileUrl}) `,
                html: `<img src="${account.avatarUrl || ""}" alt="" />${account.nickname || account.name} (${account.name})`,
              }));
            },
          },
        ]
      : hint?.extend;
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
      hint: { delay: 0, parse: false, ...hint, extend: mentionHint || [] },
      // Supplying i18n bypasses Vditor's CDN i18n loader. The local Lute URL is
      // emitted by Vite with the application assets rather than fetched remotely.
      _lutePath: lutePath,
      i18n,
      icon: undefined,
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
        lastEditorValue = value;
        emit("update:modelValue", value);
        input?.(value);
      },
    });
    emit("update:vditorInstance", vditor.value);
  } catch (error) {
    editorError.value = error instanceof Error ? error.message : "编辑器加载失败。";
  }
});

watch(
  () => props.modelValue,
  (value) => {
    if (value === lastEditorValue) {
      lastEditorValue = undefined;
      return;
    }
    if (!editorReady.value || value === undefined || vditor.value?.getValue() === value) return;
    vditor.value?.setValue(value);
  },
);

onBeforeUnmount(() => {
  disposed = true;
  window.removeEventListener("treble-theme-change", handleThemeChange);
  const editor = vditor.value;
  vditor.value = undefined;
  try {
    editor?.destroy();
  } catch (error) {
    // Vditor can race Vue's client-side route teardown and attempt to remove an
    // internal node that it has already discarded. Cleanup must not abort the
    // navigation or make Vike render its global error page.
    console.warn("编辑器清理失败", error);
  }
});

function handleDragEnter(event: DragEvent) {
  if (!hasFiles(event)) return;
  event.preventDefault();
  dropActive.value = true;
}

function handleDragOver(event: DragEvent) {
  if (!hasFiles(event)) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  dropActive.value = true;
}

function handleDragLeave(event: DragEvent) {
  if (!hasFiles(event)) return;
  const relatedTarget = event.relatedTarget;
  if (
    relatedTarget instanceof Node &&
    event.currentTarget instanceof Node &&
    event.currentTarget.contains(relatedTarget)
  ) {
    return;
  }
  dropActive.value = false;
}

async function handleDrop(event: DragEvent) {
  dropActive.value = false;
  const files = Array.from(event.dataTransfer?.files || []);
  if (files.length === 0) return;
  event.preventDefault();
  event.stopPropagation();

  await uploadImages(files);
}

async function handlePaste(event: ClipboardEvent) {
  const files = clipboardImageFiles(event.clipboardData);
  if (files.length === 0) return;
  event.preventDefault();

  await uploadImages(files.map((file, index) => clipboardImageFile(file, index)));
}

function clipboardImageFiles(clipboard: DataTransfer | null) {
  const files = Array.from(clipboard?.files || []).filter((file) => file.type.startsWith("image/"));
  if (files.length > 0) return files;

  return Array.from(clipboard?.items || []).flatMap((item) => {
    if (item.kind !== "file" || !item.type.startsWith("image/")) return [];
    const file = item.getAsFile();
    return file ? [file] : [];
  });
}

async function uploadImages(files: File[]) {
  const selection = selectionRange();
  const messageID = `${editorId}-image-upload`;
  let loading = message.loading(`正在准备 ${files.length} 张图片…`, { id: messageID });
  try {
    let insertAt = selection;
    for (const [index, file] of files.entries()) {
      try {
        const markdown = await uploadMarkdownImage(file, (progress) => {
          loading = message.loading(`正在上传图片 ${index + 1}/${files.length}（${progress}%）…`, { id: messageID });
        });
        if (disposed || !editorReady.value) return;
        insertMarkdown(markdown, insertAt);
        insertAt = undefined;
      } catch (error) {
        message.error(error instanceof Error ? error.message : "图片上传失败，请重试。");
      }
    }
  } finally {
    loading.close();
  }
}

function clipboardImageFile(file: File, index: number) {
  if (file.name) return file;
  const extension = file.type.split("/")[1] || "png";
  return new File([file], `clipboard-image-${index + 1}.${extension}`, { type: file.type });
}

function hasFiles(event: DragEvent) {
  return (event.dataTransfer?.files.length || 0) > 0 || Array.from(event.dataTransfer?.types || []).includes("Files");
}

function selectionRange() {
  const root = currentEditorRoot();
  const range = window.getSelection()?.rangeCount ? window.getSelection()?.getRangeAt(0) : undefined;
  if (!root || !range || !root.contains(range.commonAncestorContainer)) return undefined;
  return range.cloneRange();
}

function currentEditorRoot() {
  const editor = vditor.value as unknown as {
    vditor?: {
      currentMode: "ir" | "sv" | "wysiwyg";
      ir: { element: HTMLElement };
      sv: { element: HTMLElement };
      wysiwyg: { element: HTMLElement };
    };
  };
  return editor.vditor?.[editor.vditor.currentMode].element;
}

function insertMarkdown(value: string, range?: Range) {
  const editor = vditor.value;
  if (!editor) return;
  editor.focus();
  if (range) {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  editor.insertValue(value);
}

defineExpose({
  vditor,
  getValue() {
    return vditor.value?.getValue() || "";
  },
  setValue(value: string) {
    vditor.value?.setValue(value);
  },
  setValueAndFocus(value: string, cursorOffset: number) {
    const editor = vditor.value;
    if (!editor) return;
    editor.setValue(value);
    editor.focus();

    const internal = editor as unknown as {
      vditor: {
        currentMode: "ir" | "sv" | "wysiwyg";
        ir: { element: HTMLElement };
        sv: { element: HTMLElement };
        wysiwyg: { element: HTMLElement };
      };
    };
    const root = internal.vditor[internal.vditor.currentMode].element;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let remaining = cursorOffset;
    let text = walker.nextNode();
    while (text) {
      const length = text.textContent?.length || 0;
      if (remaining <= length) {
        const range = document.createRange();
        range.setStart(text, remaining);
        range.collapse(true);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        return;
      }
      remaining -= length;
      text = walker.nextNode();
    }
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
  <section
    :aria-busy="!editorReady"
    :class="{ 'editor-shell--drop-active': dropActive }"
    :inert="editorReady ? undefined : ''"
    class="editor-shell"
    @dragenter.capture="handleDragEnter"
    @dragleave.capture="handleDragLeave"
    @dragover.capture="handleDragOver"
    @drop.capture="handleDrop"
    @paste.capture="handlePaste"
  >
    <div :id="editorId" ref="vditorRef" :style="{ height, width }" />
    <div v-if="!editorReady" aria-live="polite" class="editor-shell__loading" role="status">
      <span aria-hidden="true" class="editor-shell__spinner" />
      {{ editorError || "正在加载编辑器..." }}
    </div>
    <div v-if="dropActive" class="editor-shell__drop-hint">松开以上传图片</div>
  </section>
</template>

<style scoped>
.editor-shell {
  position: relative;
  min-width: 0;
  background: var(--layer-background-color);
}

.editor-shell--drop-active {
  outline: 2px dashed var(--toc-hover-color);
  outline-offset: -2px;
}

.editor-shell__drop-hint {
  position: absolute;
  z-index: 3;
  inset: 0;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--layer-background-color) 84%, transparent);
  color: var(--toc-hover-color);
  font-size: 14px;
  font-weight: 600;
  pointer-events: none;
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
