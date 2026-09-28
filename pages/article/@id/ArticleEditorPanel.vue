<script setup lang="ts">
import type { IOptions } from "vditor";
import { ref } from "vue";
import ClientOnly from "@/components/ClientOnly";
import Editor from "@/components/Editor";
import Icon from "@/components/community/Icon.vue";

const props = withDefaults(defineProps<{
  open: boolean;
  title: string;
  ariaLabel: string;
  editorName: string;
  placeholder: string;
  submitLabel: string;
  submitting: boolean;
  helperText?: string;
}>(), {
  helperText: "请遵守社区规范。",
});

const emit = defineEmits<{
  close: [];
  submit: [];
}>();

const content = defineModel<string>({ required: true });
const editorRef = ref<InstanceType<typeof Editor>>();
const editorOptions = {
  preview: { mode: "editor" },
  resize: { enable: true, position: "top" },
} satisfies IOptions;

function getValue() {
  return editorRef.value?.getValue() || content.value;
}

function clearCache() {
  editorRef.value?.clearCache();
}

defineExpose({ clearCache, getValue });
</script>

<template>
  <Transition name="comment-editor" :duration="{ enter: 260, leave: 180 }">
    <section
      v-if="props.open"
      class="editor-panel"
      role="dialog"
      aria-modal="true"
      :aria-label="props.ariaLabel"
      @keydown.esc="emit('close')"
    >
      <button type="button" class="editor-bg" :aria-label="`关闭${props.title}编辑器`" @click="emit('close')" />
      <div class="wrapper">
        <header class="editor-panel__header">
          <strong class="editor-panel__context">
            <Icon name="reply" />
            {{ props.title }}
          </strong>
          <button type="button" class="editor-panel__close" :aria-label="`收起${props.title}编辑器`" @click="emit('close')">
            <Icon name="down" />
          </button>
        </header>
        <ClientOnly>
          <Editor ref="editorRef" v-model="content" :name="props.editorName" height="200px" :options="{ ...editorOptions, placeholder: props.placeholder }" />
        </ClientOnly>
        <footer class="comment-submit">
          <span class="ft-fade">{{ props.helperText }}</span>
          <span class="comment-submit__actions">
            <button type="button" class="article-editor-panel__button" :disabled="props.submitting" @click="emit('close')">取消</button>
            <button type="button" class="article-editor-panel__button article-editor-panel__button--submit" :disabled="props.submitting" @click="emit('submit')">
              {{ props.submitting ? "正在提交..." : props.submitLabel }}
            </button>
          </span>
        </footer>
      </div>
    </section>
  </Transition>
</template>
