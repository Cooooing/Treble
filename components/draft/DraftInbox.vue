<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { navigate } from "vike/client/router";
import type { ArticleListItem } from "@bass/bbs-sdk-fetch/models/ArticleListItem";
import type { ReqArticleTypeEnum } from "@bass/bbs-sdk-fetch/models/ReqArticle";
import EmptyState from "@/components/feedback/EmptyState.vue";
import { message } from "@/components/feedback/message";
import {
  getLocalArticleDraft,
  hasUnsavedLocalArticleDraft,
  markServerArticleDraftRestore,
  removeLocalArticleDraft,
} from "@/services/localDrafts";
import { currentAccount } from "@/services/sessionState";
import { bbsClient } from "@/utils/sdk";

const isOpen = defineModel<boolean>({ default: false });
const drafts = ref<ArticleListItem[]>([]);
const deletingId = ref<string>();
const pendingDeletion = ref<string>();
const pendingRestore = ref<string>();
const closeButton = ref<HTMLButtonElement>();
const dialog = ref<HTMLElement>();
let deletionTimer: ReturnType<typeof window.setTimeout> | undefined;

async function refresh() {
  const authorId = currentAccount.value?.profile?.id;
  if (!authorId) {
    drafts.value = [];
    return;
  }
  const response = await bbsClient.article.list({
    listArticlesReq: {
      page: { page: 1, size: 100 },
      query: { authorId, publishStatus: "ARTICLE_PUBLISH_STATUS_DRAFT" },
    },
  });
  drafts.value = response.rows || [];
}

function close() {
  isOpen.value = false;
}

function clearPendingDeletion() {
  pendingDeletion.value = undefined;
  if (deletionTimer) window.clearTimeout(deletionTimer);
  deletionTimer = undefined;
}

function draftType(draft: ArticleListItem) {
  return draft.type as ReqArticleTypeEnum;
}

function restore(draft: ArticleListItem) {
  if (!draft.id) return;
  const type = draftType(draft);
  if (hasUnsavedLocalArticleDraft(type) && pendingRestore.value !== draft.id) {
    pendingRestore.value = draft.id;
    message.warning("当前本地有未保存内容；再次点击恢复将覆盖它。", { duration: 5000 });
    return;
  }
  if (hasUnsavedLocalArticleDraft(type)) {
    removeLocalArticleDraft(type);
  }
  markServerArticleDraftRestore(draft.id, type);
  pendingRestore.value = undefined;
  close();
  void navigate(`/post/${draft.id}`);
}

async function deleteDraft(draft: ArticleListItem) {
  if (!draft.id) return;
  if (pendingDeletion.value !== draft.id) {
    pendingDeletion.value = draft.id;
    if (deletionTimer) window.clearTimeout(deletionTimer);
    deletionTimer = window.setTimeout(clearPendingDeletion, 5_000);
    message.warning("再次点击“确认删除”将永久删除该草稿。", { duration: 5000 });
    return;
  }

  deletingId.value = draft.id;
  try {
    await bbsClient.article.discardDraft({ discardDraftArticleReq: { articleId: draft.id } });
    const type = draftType(draft);
    if (getLocalArticleDraft(type)?.articleId === draft.id) {
      removeLocalArticleDraft(type);
    }
    clearPendingDeletion();
    await refresh();
    message.success("草稿已删除。");
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "删除草稿失败，请稍后重试。");
  } finally {
    deletingId.value = undefined;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    close();
    return;
  }
  if (event.key !== "Tab" || !dialog.value) return;
  const focusable = Array.from(
    dialog.value.querySelectorAll<HTMLElement>(
      "button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)",
    ),
  );
  const first = focusable.at(0);
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(isOpen, async (open) => {
  if (!open) return;
  clearPendingDeletion();
  pendingRestore.value = undefined;
  try {
    await refresh();
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "草稿箱加载失败，请稍后重试。");
  }
  await nextTick();
  closeButton.value?.focus();
});

onBeforeUnmount(() => {
  if (deletionTimer) window.clearTimeout(deletionTimer);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="draft-inbox">
      <div v-if="isOpen" class="draft-inbox" @keydown="handleKeydown">
        <div class="draft-inbox__backdrop" aria-hidden="true" @click="close" />
        <section
          ref="dialog"
          class="draft-inbox__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="draftInboxTitle"
        >
          <header class="draft-inbox__header">
            <div>
              <h2 id="draftInboxTitle">草稿箱</h2>
            </div>
            <button ref="closeButton" class="draft-inbox__close" type="button" aria-label="关闭草稿箱" @click="close">
              ×
            </button>
          </header>

          <div v-if="drafts.length" class="draft-inbox__list">
            <article v-for="draft in drafts" :key="draft.id" class="draft-inbox__item">
              <div class="draft-inbox__content">
                <h3>{{ draft.title || "未命名草稿" }}</h3>
                <p>{{ draft.content || "暂无正文" }}</p>
                <small>{{ draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : "刚刚" }}</small>
              </div>
              <div class="draft-inbox__actions">
                <button
                  class="draft-inbox__action"
                  type="button"
                  :disabled="Boolean(deletingId)"
                  @click="restore(draft)"
                >
                  {{ pendingRestore === draft.id ? "确认恢复" : "恢复" }}
                </button>
                <button
                  class="draft-inbox__action draft-inbox__action--danger"
                  type="button"
                  :disabled="Boolean(deletingId)"
                  @click="deleteDraft(draft)"
                >
                  {{ deletingId === draft.id ? "正在删除..." : pendingDeletion === draft.id ? "确认删除" : "删除" }}
                </button>
              </div>
            </article>
          </div>
          <EmptyState v-else />
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.draft-inbox {
  position: fixed;
  z-index: 1200;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
}

.draft-inbox__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.48);
}
.draft-inbox__dialog {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(760px, 100%);
  max-height: min(700px, calc(100dvh - 40px));
  overflow: hidden;
  border: 1px solid var(--layer-border-color);
  border-radius: 4px;
  background: var(--layer-background-color);
  box-shadow: var(--box-shadow);
  color: var(--text-color);
}
.draft-inbox__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--layer-border-color);
}
.draft-inbox__header h2 {
  margin: 0;
  font-size: 18px;
  line-height: 1.5;
}
.draft-inbox__header p {
  margin: 4px 0 0;
  color: var(--text-fade-color);
  font-size: 13px;
}
.draft-inbox__close {
  display: grid;
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--text-fade-color);
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
}
.draft-inbox__close:hover {
  background: var(--background-secondary-color);
  color: var(--text-color);
}
.draft-inbox__close:focus-visible,
.draft-inbox__actions button:focus-visible {
  outline: 2px solid var(--toc-hover-color);
  outline-offset: 2px;
}
.draft-inbox__list {
  overflow: auto;
}
.draft-inbox__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--layer-border-color);
}
.draft-inbox__item:last-child {
  border-bottom: 0;
}
.draft-inbox__content {
  min-width: 0;
}
.draft-inbox__content h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}
.draft-inbox__content p {
  margin: 6px 0;
  overflow: hidden;
  color: var(--text-fade-color);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.draft-inbox__content small {
  color: var(--text-fade-color);
  font-size: 12px;
}
.draft-inbox__actions {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;
}
.draft-inbox__action {
  min-height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--toc-hover-color);
  cursor: pointer;
  font: inherit;
  box-shadow: none;
  transition: none;
}
.draft-inbox__action:hover,
.draft-inbox__action:focus-visible {
  background: var(--background-secondary-color);
  outline: 0;
  box-shadow: none;
  transform: none;
  animation: none;
}
.draft-inbox__action--danger {
  color: var(--error-color, #c33);
}
.draft-inbox__action:disabled {
  cursor: wait;
  opacity: 0.55;
}
.draft-inbox :deep(.empty-state) {
  padding: 56px 24px;
}
:global(html[data-theme="dark"]) .draft-inbox__backdrop {
  background: rgba(0, 0, 0, 0.62);
}
:global(html[data-theme="dark"]) .draft-inbox__dialog {
  border-color: #1f252b;
  background: #2f363d;
  box-shadow: none;
  color: #d1d5da;
}
:global(html[data-theme="dark"]) .draft-inbox__header,
:global(html[data-theme="dark"]) .draft-inbox__item {
  border-color: #1f252b;
}
:global(html[data-theme="dark"]) .draft-inbox__content h3 {
  color: #f0f6fc;
}
:global(html[data-theme="dark"]) .draft-inbox__content :is(p, small),
:global(html[data-theme="dark"]) .draft-inbox__close {
  color: #aeb8c2;
}
:global(html[data-theme="dark"]) :is(.draft-inbox__close, .draft-inbox__action) {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}
:global(html[data-theme="dark"]) .draft-inbox__action {
  color: #79b8ff;
}
:global(html[data-theme="dark"]) .draft-inbox__action--danger {
  color: #ff7b72;
}
:global(html[data-theme="dark"]) :is(.draft-inbox__close, .draft-inbox__action):hover,
:global(html[data-theme="dark"]) :is(.draft-inbox__close, .draft-inbox__action):focus-visible {
  background: #3a444d;
  color: #f0f6fc;
}
.draft-inbox-enter-active {
  transition: opacity 0.18s ease;
}
.draft-inbox-enter-active .draft-inbox__dialog {
  transition:
    opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.draft-inbox-leave-active {
  transition: opacity 0.12s ease;
}
.draft-inbox-leave-active .draft-inbox__dialog {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}
.draft-inbox-enter-from,
.draft-inbox-leave-to {
  opacity: 0;
}
.draft-inbox-enter-from .draft-inbox__dialog,
.draft-inbox-leave-to .draft-inbox__dialog {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
@media (max-width: 640px) {
  .draft-inbox {
    align-items: end;
    padding: 0;
  }
  .draft-inbox__dialog {
    width: 100%;
    max-height: min(78dvh, 700px);
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 8px 8px 0 0;
  }
  .draft-inbox__item {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
  .draft-inbox__actions {
    width: 100%;
    justify-content: flex-end;
  }
}
@media (prefers-reduced-motion: reduce) {
  .draft-inbox-enter-active,
  .draft-inbox-leave-active,
  .draft-inbox-enter-active .draft-inbox__dialog,
  .draft-inbox-leave-active .draft-inbox__dialog {
    transition: none;
  }
}
</style>
