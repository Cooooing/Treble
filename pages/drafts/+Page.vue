<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { LocalArticleDraft } from "@/services/localDrafts";
import { listLocalArticleDrafts, removeLocalArticleDraft } from "@/services/localDrafts";
import { message } from "@/components/Message";

const drafts = ref<LocalArticleDraft[]>([]);
const pendingDeletion = ref<string>();

function refresh() {
  drafts.value = listLocalArticleDrafts();
}

function deleteDraft(id: string) {
  if (pendingDeletion.value !== id) {
    pendingDeletion.value = id;
    message.warning("再次点击删除，草稿将无法恢复。", { duration: 5000 });
    window.setTimeout(() => {
      if (pendingDeletion.value === id) pendingDeletion.value = undefined;
    }, 5000);
    return;
  }
  removeLocalArticleDraft(id);
  pendingDeletion.value = undefined;
  refresh();
  message.success("草稿已删除。");
}

function summary(content: string) {
  return content.replace(/[#>*_`~\-[\]()]/g, " ").replace(/\s+/g, " ").trim() || "暂无正文";
}

onMounted(refresh);
</script>

<template>
  <main class="main drafts-page">
    <section class="wrapper module drafts-page__module" aria-labelledby="draftsTitle">
      <header class="module__header">
        <h1 id="draftsTitle">草稿箱</h1>
        <a class="btn small green" href="/pre-post">写文章</a>
      </header>
      <div v-if="drafts.length" class="drafts-page__list">
        <article v-for="draft in drafts" :key="draft.id" class="drafts-page__item">
          <div class="drafts-page__content">
            <a :href="`/post?type=${draft.article.type}&draft=${draft.id}`">{{ draft.article.title || "未命名草稿" }}</a>
            <p class="ft-fade">{{ summary(draft.article.content) }}</p>
            <small class="ft-fade">{{ new Date(draft.updatedAt).toLocaleString() }} · {{ draft.tagNames.length ? draft.tagNames.join("、") : "未添加标签" }}</small>
          </div>
          <div class="drafts-page__actions">
            <a class="btn small" :href="`/post?type=${draft.article.type}&draft=${draft.id}`">继续编辑</a>
            <button class="btn small red" type="button" @click="deleteDraft(draft.id)">{{ pendingDeletion === draft.id ? "确认删除" : "删除" }}</button>
          </div>
        </article>
      </div>
      <div v-else class="empty">
        <p>没有鸡，哪来的鸡蛋呢？</p>
        <a class="btn green" href="/pre-post">开始写第一篇文章</a>
      </div>
    </section>
  </main>
</template>

<style scoped>
.drafts-page { min-height: calc(100dvh - 155px); padding: 20px 0; }
.drafts-page__module { max-width: 960px; }
.module__header, .drafts-page__item, .drafts-page__actions { display: flex; align-items: center; }
.module__header { justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--layer-border-color); }
.module__header h1 { margin: 0; font-size: 18px; }
.drafts-page__item { justify-content: space-between; gap: 20px; padding: 16px; border-bottom: 1px solid var(--layer-border-color); }
.drafts-page__content { min-width: 0; }
.drafts-page__content > a { color: var(--text-color); font-size: 16px; font-weight: 600; text-decoration: none; }
.drafts-page__content > a:hover { color: var(--toc-hover-color); }
.drafts-page__content p { max-width: 680px; margin: 6px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.drafts-page__actions { flex: 0 0 auto; gap: 8px; }
.empty { padding: 64px 24px; text-align: center; }
@media (max-width: 640px) { .drafts-page__item { align-items: flex-start; flex-direction: column; } .drafts-page__actions { width: 100%; justify-content: flex-end; } }
</style>
