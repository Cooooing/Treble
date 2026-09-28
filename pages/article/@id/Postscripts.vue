<script setup lang="ts">
import { computed, ref } from "vue";
import type { ArticlePostscript } from "@bass/bbs-sdk-fetch/models/ArticlePostscript";
import { message } from "@/components/Message";
import { fromNow } from "@/utils/date";
import { bbsClient } from "@/utils/sdk";

const props = defineProps<{
  articleId: string;
  canAdd: boolean;
  postscripts: ArticlePostscript[];
}>();

const emit = defineEmits<{
  added: [postscript: ArticlePostscript];
}>();

const content = ref("");
const editorOpen = ref(false);
const submitting = ref(false);

const orderedPostscripts = computed(() => [...props.postscripts].sort((left, right) => {
  return (left.createdAt?.getTime() || 0) - (right.createdAt?.getTime() || 0);
}));

function closeEditor() {
  content.value = "";
  editorOpen.value = false;
}

async function submit() {
  const value = content.value.trim();
  if (!value) {
    message.warning("附言内容不能为空。");
    return;
  }

  if (submitting.value) return;
  submitting.value = true;
  try {
    const response = await bbsClient.postscript.add({ addPostscriptReq: { articleId: props.articleId, content: value } });
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
  <section v-if="orderedPostscripts.length || canAdd" class="article-postscripts" aria-label="文章附言">
    <header class="article-postscripts__header">
      <h2>附言</h2>
      <button v-if="canAdd && !editorOpen" type="button" class="article-postscripts__add" @click="editorOpen = true">添加附言</button>
    </header>

    <ol v-if="orderedPostscripts.length" class="article-postscripts__list">
      <li v-for="(postscript, index) in orderedPostscripts" :key="postscript.id">
        <header>
          <strong>附言 {{ index + 1 }}</strong>
          <time v-if="postscript.createdAt">{{ fromNow(postscript.createdAt) }}</time>
        </header>
        <div v-if="postscript.contentRender" class="vditor-reset" v-html="postscript.contentRender" />
        <p v-else>{{ postscript.content }}</p>
      </li>
    </ol>

    <form v-if="editorOpen" class="article-postscripts__editor" @submit.prevent="submit">
      <label for="postscript-content">添加附言</label>
      <textarea
        id="postscript-content"
        v-model="content"
        :disabled="submitting"
        maxlength="2000"
        placeholder="补充文章内容..."
        rows="4"
      />
      <div class="article-postscripts__actions">
        <button type="button" :disabled="submitting" @click="closeEditor">取消</button>
        <button class="btn" type="submit" :disabled="submitting">{{ submitting ? "添加中..." : "添加附言" }}</button>
      </div>
    </form>
  </section>
</template>
