<script lang="ts" setup>
import type { IOptions } from "vditor";
import { ref } from "vue";
import ClientOnly from "@/components/ui/ClientOnly.vue";
import RichTextEditor from "@/components/content/RichTextEditor.vue";
import Icon from "@/components/ui/Icon.vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    ariaLabel: string;
    editorName: string;
    placeholder: string;
    submitLabel: string;
    submitting: boolean;
    helperText?: string;
  }>(),
  {
    helperText: "请遵守社区规范。",
  },
);

const emit = defineEmits<{
  close: [];
  submit: [];
}>();

const content = defineModel<string>({ required: true });
const editorRef = ref<InstanceType<typeof RichTextEditor>>();
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
  <Transition :duration="{ enter: 260, leave: 180 }" name="comment-editor">
    <section
      v-if="props.open"
      :aria-label="props.ariaLabel"
      aria-modal="true"
      class="editor-panel"
      role="dialog"
      @keydown.esc="emit('close')"
    >
      <button :aria-label="`关闭${props.title}编辑器`" class="editor-bg" type="button" @click="emit('close')" />
      <div class="wrapper">
        <header class="editor-panel__header">
          <strong class="editor-panel__context">
            <Icon name="reply" />
            {{ props.title }}
          </strong>
          <button
            :aria-label="`收起${props.title}编辑器`"
            class="editor-panel__close"
            type="button"
            @click="emit('close')"
          >
            <Icon name="down" />
          </button>
        </header>
        <ClientOnly>
          <RichTextEditor
            ref="editorRef"
            v-model="content"
            :name="props.editorName"
            :options="{ ...editorOptions, placeholder: props.placeholder }"
            height="200px"
          />
        </ClientOnly>
        <footer class="comment-submit">
          <span class="ft-fade">{{ props.helperText }}</span>
          <span class="comment-submit__actions">
            <button
              :disabled="props.submitting"
              class="article-editor-panel__button"
              type="button"
              @click="emit('close')"
            >
              取消
            </button>
            <button
              :disabled="props.submitting"
              class="article-editor-panel__button article-editor-panel__button--submit"
              type="button"
              @click="emit('submit')"
            >
              {{ props.submitting ? "正在提交..." : props.submitLabel }}
            </button>
          </span>
        </footer>
      </div>
    </section>
  </Transition>
</template>
