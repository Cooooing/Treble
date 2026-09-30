<script lang="ts" setup>
import { computed, ref } from "vue";
import type { ArticlePostscript } from "@bass/bbs-sdk-fetch/models/ArticlePostscript";
import { message } from "@/components/feedback/message";
import { fromNow } from "@/utils/date";
import { bbsClient } from "@/utils/sdk";
import ArticleEditorPanel from "./ArticleEditorPanel.vue";

const props = defineProps<{
  articleId: string;
  postscripts: ArticlePostscript[];
}>();

const emit = defineEmits<{
  added: [postscript: ArticlePostscript];
}>();

const content = ref("");
const editorOpen = defineModel<boolean>("editorOpen", { default: false });
const editorPanelRef = ref<InstanceType<typeof ArticleEditorPanel>>();
const submitting = ref(false);

const orderedPostscripts = computed(() =>
  [...props.postscripts].sort((left, right) => {
    return (left.createdAt?.getTime() || 0) - (right.createdAt?.getTime() || 0);
  }),
);

function closeEditor() {
  content.value = "";
  editorOpen.value = false;
  editorPanelRef.value?.clearCache();
}

async function submit() {
  const value = editorPanelRef.value?.getValue().trim() || content.value.trim();
  if (!value) {
    message.warning("附言内容不能为空。");
    return;
  }

  if (submitting.value) return;
  submitting.value = true;
  try {
    const response = await bbsClient.postscript.add({
      addPostscriptReq: { articleId: props.articleId, content: value },
    });
    if (!response.postscript) throw new Error("附言已提交，但未返回内容。");
    emit("added", response.postscript);
    closeEditor();
    message.success("附言已添加。");
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "添加附言失败，请稍后重试。");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section v-if="orderedPostscripts.length" aria-label="文章附言" class="article-postscripts">
    <ol class="article-postscripts__list">
      <li v-for="(postscript, index) in orderedPostscripts" :key="postscript.id">
        <header>
          <h2>第 {{ index + 1 }} 条附言</h2>
          <time>{{ postscript.createdAt ? fromNow(postscript.createdAt) : "刚刚" }}</time>
        </header>
        <div v-if="postscript.contentRender" class="vditor-reset" v-html="postscript.contentRender" />
        <p v-else>{{ postscript.content }}</p>
      </li>
    </ol>
  </section>
  <ArticleEditorPanel
    ref="editorPanelRef"
    v-model="content"
    :open="editorOpen"
    :submitting="submitting"
    aria-label="添加附言"
    editor-name="postscript"
    placeholder="补充文章内容..."
    submit-label="添加附言"
    title="添加附言"
    @close="closeEditor"
    @submit="submit"
  />
</template>
