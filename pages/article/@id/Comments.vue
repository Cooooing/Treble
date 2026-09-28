<script setup lang="ts">
import { computed, ref } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import type { ArticleDetail } from "@bass/bbs-sdk-fetch/models/ArticleDetail";
import type { CreateCommentReq } from "@bass/bbs-sdk-fetch/models/CreateCommentReq";
import { ListCommentThreadsReqOrderEnum } from "@bass/bbs-sdk-fetch/models/ListCommentThreadsReq";
import type { ListCommentRepliesResp } from "@bass/bbs-sdk-fetch/models/ListCommentRepliesResp";
import type { ListCommentThreadsResp } from "@bass/bbs-sdk-fetch/models/ListCommentThreadsResp";
import type { RespCommentListItem } from "@bass/bbs-sdk-fetch/models/RespCommentListItem";
import type { RespCommentThread } from "@bass/bbs-sdk-fetch/models/RespCommentThread";
import type { IOptions } from "vditor";
import Editor from "@/components/Editor";
import Avatar from "@/components/Avatar";
import ClientOnly from "@/components/ClientOnly";
import { message } from "@/components/Message";
import Icon from "@/components/community/Icon.vue";
import { currentAccount } from "@/utils/auth/state";
import { fromNow } from "@/utils/date";
import { bbsClient } from "@/utils/sdk";

const props = defineProps<{ article: ArticleDetail; comments: ListCommentThreadsResp }>();
const pageContext = usePageContext();
const account = computed(() => typeof window === "undefined" ? pageContext.user : pageContext.user || currentAccount.value);
const threads = ref(props.comments.rows || []);
const threadPage = ref(props.comments.page);
const commentOrder = ref<ListCommentThreadsReqOrderEnum>(ListCommentThreadsReqOrderEnum.COMMENT_ORDER_HOTTEST);
const replyPages = ref<Record<string, ListCommentRepliesResp>>({});
const collapsedReplyParentIds = ref<Record<string, true>>({});
const replyComment = ref<RespCommentListItem>();
const editorRef = ref<InstanceType<typeof Editor>>();
const submitting = ref(false);
const loadingThreads = ref(false);
const loadingReplyParentId = ref<string>();
const editorOpen = ref(false);
const comment = ref<CreateCommentReq>({ articleId: props.article.id || "", content: "" });
const total = computed(() => threadPage.value?.total || 0);
const replyPageSize = 10;
const commentEditorOptions = {
  preview: { mode: "editor" },
  resize: { enable: true, position: "top" },
  placeholder: "友善地留下一个评论吧 :) ",
} satisfies IOptions;

function openCommentEditor(target?: RespCommentListItem) {
  if (!account.value) {
    window.location.assign(`/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
    return;
  }
  replyComment.value = target;
  comment.value = { articleId: props.article.id || "", content: "", replyId: target?.id };
  editorOpen.value = true;
}

function closeCommentEditor() {
  editorOpen.value = false;
  editorRef.value?.clearCache();
}

async function submit() {
  const content = editorRef.value?.getValue().trim() || comment.value.content.trim();
  if (!content) {
    return void message.warning("评论内容不能为空。");
  }
  comment.value.content = content;
  submitting.value = true;
  try {
    await bbsClient.comment.create({ createCommentReq: { ...comment.value, content } });
    closeCommentEditor();
    window.location.reload();
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "评论提交失败，请稍后重试。");
  } finally {
    submitting.value = false;
  }
}

async function reactToComment(action: "like" | "thank", id?: string) {
  if (!id) return;
  try {
    if (action === "like") {
      await bbsClient.comment.like({ likeCommentReq: { id, active: true } });
    } else {
      await bbsClient.comment.thank({ thankCommentReq: { id, active: true } });
    }
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "操作失败，请稍后重试。");
  }
}

async function loadThreads(page = 1, order = commentOrder.value) {
  if (!props.article.id || loadingThreads.value) return;
  loadingThreads.value = true;
  try {
    const response = await bbsClient.comment.listThreads({
      listCommentThreadsReq: {
        articleId: props.article.id,
        order,
        page: { page, size: 20 },
        replyPreviewLimit: 3,
      },
    });
    commentOrder.value = order;
    threads.value = response.rows || [];
    threadPage.value = response.page;
    replyPages.value = {};
    collapsedReplyParentIds.value = {};
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "评论暂时无法加载，请稍后重试。");
  } finally {
    loadingThreads.value = false;
  }
}

function isRepliesCollapsed(parentId: string) {
  return Boolean(collapsedReplyParentIds.value[parentId]);
}

function isRepliesFullyExpanded(thread: RespCommentThread) {
  const parentId = thread.root?.id;
  if (!parentId || isRepliesCollapsed(parentId)) return false;
  return Boolean(replyPages.value[parentId]) || (thread.previewReplies?.length || 0) >= (thread.replyCount || 0);
}

function displayedReplies(thread: RespCommentThread) {
  const parentId = thread.root?.id;
  if (!parentId || isRepliesCollapsed(parentId)) return [];
  return replyPages.value[parentId]?.rows || thread.previewReplies || [];
}

function replyTotalPages(thread: RespCommentThread) {
  const parentId = thread.root?.id;
  const totalReplies = replyPages.value[parentId || ""]?.page?.total || thread.replyCount || 0;
  return Math.max(1, Math.ceil(totalReplies / replyPageSize));
}

function replyPageNumbers(totalPages: number, currentPage: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
  if (currentPage >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
}

async function revealReplies(thread: RespCommentThread) {
  const parentId = thread.root?.id;
  if (!parentId) return;
  if (isRepliesCollapsed(parentId)) {
    const collapsed = { ...collapsedReplyParentIds.value };
    delete collapsed[parentId];
    collapsedReplyParentIds.value = collapsed;
  }
  if (replyPages.value[parentId] || (thread.previewReplies?.length || 0) >= (thread.replyCount || 0)) return;
  await loadReplies(parentId, 1);
}

function collapseReplies(parentId: string) {
  collapsedReplyParentIds.value = { ...collapsedReplyParentIds.value, [parentId]: true };
}

async function loadReplies(parentId: string, page: number) {
  if (!props.article.id || loadingReplyParentId.value) return;
  loadingReplyParentId.value = parentId;
  try {
    const response = await bbsClient.comment.listReplies({
      listCommentRepliesReq: {
        articleId: props.article.id,
        parentId,
        order: "COMMENT_ORDER_OLDEST",
        page: { page, size: replyPageSize },
      },
    });
    replyPages.value = { ...replyPages.value, [parentId]: response };
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "回复暂时无法加载，请稍后重试。");
  } finally {
    loadingReplyParentId.value = undefined;
  }
}
</script>

<template>
  <section class="comment-thread-list" :aria-busy="loadingThreads">
    <header class="comment-thread-list__header">
      <strong>评论 <span>{{ total }}</span></strong>
      <nav class="comment-sort" aria-label="评论排序">
        <button
          type="button"
          :class="{ 'comment-sort__item--active': commentOrder === 'COMMENT_ORDER_HOTTEST' }"
          :disabled="loadingThreads"
          @click="loadThreads(1, 'COMMENT_ORDER_HOTTEST')"
        >最热</button>
        <i aria-hidden="true" />
        <button
          type="button"
          :class="{ 'comment-sort__item--active': commentOrder === 'COMMENT_ORDER_NEWEST' }"
          :disabled="loadingThreads"
          @click="loadThreads(1, 'COMMENT_ORDER_NEWEST')"
        >最新</button>
      </nav>
      <a class="comment-thread-list__to-footer" href="#article-footer" aria-label="跳至页面底部"><Icon name="down" /></a>
    </header>

    <div class="comment__reply">
      <div v-if="account" class="fn-flex">
        <Avatar
          class="avatar"
          :url="account.profile?.avatarUrl"
          :name="account.profile?.name"
          :size="48"
        />
        <button type="button" class="reply__text fn-flex-1" @click="openCommentEditor()">请输入回帖内容...</button>
      </div>
      <button v-else type="button" class="reply__text fn-flex-1" @click="openCommentEditor()">登录参与讨论...</button>
    </div>

    <div v-if="threads.length" class="article-comments__list">
      <ul>
        <li v-for="thread in threads" :key="thread.root?.id" class="article-comment comment-thread">
          <template v-if="thread.root">
            <div :id="`comment_${thread.root.id}`" class="comment-thread__root fn-flex">
              <Avatar :url="thread.root.user?.avatarUrl" :name="thread.root.user?.name" :size="48" />
              <div class="fn-flex-1">
                <div class="comment-info">
                  <span class="ft-gray">{{ thread.root.user?.nickname || thread.root.user?.name || "匿名用户" }}</span>
                </div>
                <section class="vditor-reset comment" v-html="thread.root.contentRender || thread.root.content" />
                <footer class="comment-thread__action">
                  <span class="ft-fade">{{ thread.root.createdAt ? fromNow(thread.root.createdAt) : "刚刚" }}</span>
                  <span class="comment-thread__action-buttons">
                    <button type="button" @click="reactToComment('like', thread.root.id)">
                      <Icon name="thumbs-up" /> {{ thread.root.likeCount || 0 }}
                    </button>
                    <button type="button" @click="reactToComment('thank', thread.root.id)">
                      <Icon name="heart" /> {{ thread.root.thankCount || 0 }}
                    </button>
                    <button type="button" @click="openCommentEditor(thread.root)">
                      <Icon name="reply" /> 回复
                    </button>
                  </span>
                </footer>
              </div>
            </div>

            <section v-if="thread.replyCount" class="comment-thread__replies">
              <template v-if="!isRepliesCollapsed(thread.root.id)">
                <article v-for="reply in displayedReplies(thread)" :key="reply.id" class="comment-thread__reply">
                  <Avatar :url="reply.user?.avatarUrl" :name="reply.user?.name" :size="24" />
                  <div class="fn-flex-1">
                    <div class="comment-thread__reply-content">
                      <span class="comment-thread__user">{{ reply.user?.nickname || reply.user?.name || "匿名用户" }}</span>
                      <span v-if="reply.replyUser && reply.replyId !== thread.root.id" class="comment-thread__target">
                        回复 {{ reply.replyUser.nickname || reply.replyUser.name || "匿名用户" }}：
                      </span>
                      <span v-html="reply.contentRender || reply.content" />
                    </div>
                    <footer class="comment-thread__action">
                      <span>{{ reply.createdAt ? fromNow(reply.createdAt) : "刚刚" }}</span>
                      <span class="comment-thread__action-buttons">
                        <button type="button" @click="reactToComment('like', reply.id)"><Icon name="thumbs-up" /> {{ reply.likeCount || 0 }}</button>
                        <button type="button" @click="reactToComment('thank', reply.id)"><Icon name="heart" /> {{ reply.thankCount || 0 }}</button>
                        <button type="button" @click="openCommentEditor(reply)"><Icon name="reply" /> 回复</button>
                      </span>
                    </footer>
                  </div>
                </article>
              </template>
              <div class="comment-thread__reply-controls">
                <template v-if="isRepliesCollapsed(thread.root.id) || !isRepliesFullyExpanded(thread)">
                  <span>共 {{ thread.replyCount }} 条回复，</span>
                  <button
                    type="button"
                    class="comment-thread__toggle"
                    :disabled="loadingReplyParentId === thread.root.id"
                    @click="revealReplies(thread)"
                  >点击查看</button>
                </template>
                <template v-else>
                  <nav v-if="replyTotalPages(thread) > 1" class="comment-thread__pager" :aria-label="`评论 ${thread.root.id} 的回复分页`">
                    <span>共 {{ replyTotalPages(thread) }} 页</span>
                    <button
                      v-if="(replyPages[thread.root.id]?.page?.page || 1) > 1"
                      type="button"
                      :disabled="loadingReplyParentId === thread.root.id"
                      @click="loadReplies(thread.root.id, (replyPages[thread.root.id]?.page?.page || 1) - 1)"
                    >上一页</button>
                    <template v-for="(item, index) in replyPageNumbers(replyTotalPages(thread), replyPages[thread.root.id]?.page?.page || 1)" :key="`${item}-${index}`">
                      <span v-if="item === '…'" aria-hidden="true">…</span>
                      <button
                        v-else
                        type="button"
                        :class="{ 'comment-thread__page--current': item === (replyPages[thread.root.id]?.page?.page || 1) }"
                        :aria-current="item === (replyPages[thread.root.id]?.page?.page || 1) ? 'page' : undefined"
                        :disabled="loadingReplyParentId === thread.root.id"
                        @click="loadReplies(thread.root.id, item)"
                      >{{ item }}</button>
                    </template>
                    <button
                      v-if="(replyPages[thread.root.id]?.page?.page || 1) < replyTotalPages(thread)"
                      type="button"
                      :disabled="loadingReplyParentId === thread.root.id"
                      @click="loadReplies(thread.root.id, (replyPages[thread.root.id]?.page?.page || 1) + 1)"
                    >下一页</button>
                  </nav>
                  <button type="button" class="comment-thread__toggle" @click="collapseReplies(thread.root.id)">收起</button>
                </template>
              </div>
            </section>
          </template>
        </li>
      </ul>
      <nav v-if="total > (threadPage?.size || 20)" class="comment-root-pager" aria-label="顶层评论分页">
        <button type="button" :disabled="(threadPage?.page || 1) <= 1 || loadingThreads" @click="loadThreads((threadPage?.page || 1) - 1)">上一页</button>
        <span>{{ threadPage?.page || 1 }}</span>
        <button type="button" :disabled="(threadPage?.page || 1) * (threadPage?.size || 20) >= total || loadingThreads" @click="loadThreads((threadPage?.page || 1) + 1)">下一页</button>
      </nav>
    </div>
    <p v-else-if="!loadingThreads" class="comment-thread-list__empty">还没有回复，来抢沙发吧。</p>

    <Transition name="comment-editor" :duration="{ enter: 260, leave: 180 }">
      <section
        v-if="editorOpen"
        class="editor-panel"
        role="dialog"
        aria-modal="true"
        aria-label="发布回复"
        @keydown.esc="closeCommentEditor"
      >
        <button type="button" class="editor-bg" aria-label="关闭回复编辑器" @click="closeCommentEditor" />
        <div class="wrapper">
          <header class="editor-panel__header">
            <strong class="editor-panel__context">
              <Icon name="reply" />
              {{ replyComment ? `回复 ${replyComment.user?.nickname || replyComment.user?.name || "用户"}` : article.title }}
            </strong>
            <button type="button" class="editor-panel__close" aria-label="收起回复编辑器" @click="closeCommentEditor">
              <Icon name="down" />
            </button>
          </header>
          <ClientOnly>
            <Editor ref="editorRef" v-model="comment.content" name="comment" height="200px" :options="commentEditorOptions" />
          </ClientOnly>
          <footer class="comment-submit">
            <span class="ft-fade">请遵守社区规范。</span>
            <span class="comment-submit__actions">
              <button type="button" class="comment-submit__cancel" :disabled="submitting" @click="closeCommentEditor">取消</button>
              <button type="button" :disabled="submitting" class="green" @click="submit">{{ submitting ? "正在提交..." : "提交" }}</button>
            </span>
          </footer>
        </div>
      </section>
    </Transition>
  </section>
</template>
