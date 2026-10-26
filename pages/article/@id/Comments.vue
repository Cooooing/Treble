<script lang="ts" setup>
import { computed, ref } from "vue";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-vue/usePageContext";
import type { ArticleDetail } from "@bass/bbs-sdk-fetch/models/ArticleDetail";
import type { CreateCommentReq } from "@bass/bbs-sdk-fetch/models/CreateCommentReq";
import { ListCommentThreadsReqOrderEnum } from "@bass/bbs-sdk-fetch/models/ListCommentThreadsReq";
import type { ListCommentRepliesResp } from "@bass/bbs-sdk-fetch/models/ListCommentRepliesResp";
import type { ListCommentThreadsResp } from "@bass/bbs-sdk-fetch/models/ListCommentThreadsResp";
import type { RespCommentListItem } from "@bass/bbs-sdk-fetch/models/RespCommentListItem";
import type { RespCommentThread } from "@bass/bbs-sdk-fetch/models/RespCommentThread";
import Avatar from "@/components/identity/Avatar.vue";
import { message } from "@/components/feedback/message";
import { memberDisplayName } from "@/utils/member";
import Icon from "@/components/ui/Icon.vue";
import { currentAccount } from "@/services/sessionState";
import { pageNumber, pageRequest } from "@/utils/page";
import { bbsClient } from "@/utils/sdk";
import ArticleEditorPanel from "./ArticleEditorPanel.vue";
import CommentThread from "./CommentThread.vue";

const props = defineProps<{
  article: ArticleDetail;
  comments: ListCommentThreadsResp;
  isAuthor?: boolean;
  canAcceptAnswer?: boolean;
}>();
const emit = defineEmits<{ updated: [total: number] }>();
const pageContext = usePageContext();
const account = computed(() =>
  typeof window === "undefined" ? pageContext.user : pageContext.user || currentAccount.value,
);
const threads = ref(props.comments.rows || []);
const acceptedAnswer = ref(props.comments.acceptedAnswer);
const pinnedComment = ref(props.comments.pinnedComment);
const threadPage = ref(props.comments.page);
const commentOrder = ref<ListCommentThreadsReqOrderEnum>(ListCommentThreadsReqOrderEnum.COMMENT_ORDER_HOTTEST);
const replyPages = ref<Record<string, ListCommentRepliesResp>>({});
const collapsedReplyParentIds = ref<Record<string, true>>({});
const replyComment = ref<RespCommentListItem>();
const editorPanelRef = ref<InstanceType<typeof ArticleEditorPanel>>();
const submitting = ref(false);
const loadingThreads = ref(false);
const loadingReplyParentId = ref<string>();
const editorOpen = ref(false);
const comment = ref<CreateCommentReq>({ articleId: props.article.id || "", content: "" });
const total = computed(() => pageNumber(threadPage.value?.total, 0));
const displayedTotal = computed(
  () => total.value + (acceptedAnswer.value?.thread ? 1 : 0) + (pinnedComment.value?.thread ? 1 : 0),
);
const acceptedCommentID = computed(() => props.article.acceptedCommentId);
const canPinComment = computed(() => Boolean(props.isAuthor));
const replyPageSize = 10;

function openCommentEditor(target?: RespCommentListItem) {
  if (!account.value) {
    void navigate(`/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
    return;
  }
  replyComment.value = target;
  comment.value = { articleId: props.article.id || "", content: "", replyId: target?.id };
  editorOpen.value = true;
}

function closeCommentEditor() {
  editorOpen.value = false;
  editorPanelRef.value?.clearCache();
}

async function submit() {
  const content = editorPanelRef.value?.getValue().trim() || comment.value.content.trim();
  if (!content) {
    return void message.warning("评论内容不能为空。");
  }
  comment.value.content = content;
  submitting.value = true;
  try {
    await bbsClient.comment.create({ createCommentReq: { ...comment.value, content } });
    closeCommentEditor();
    await loadThreads(1, ListCommentThreadsReqOrderEnum.COMMENT_ORDER_NEWEST);
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "评论提交失败，请稍后重试。");
  } finally {
    submitting.value = false;
  }
}

async function reactToComment(action: "like" | "thank", id?: string) {
  if (!id) return;
  if (action === "thank") {
    const thanked = threadPage.value?.rows
      ?.flatMap((thread) => [thread.root, ...(thread.previewReplies || [])])
      .find((comment) => comment?.id === id)?.viewerActionState?.thanked;
    if (thanked) {
      message.info("感谢已完成，不能取消。");
      return;
    }
  }
  try {
    if (action === "like") {
      await bbsClient.comment.like({ likeCommentReq: { id, active: true } });
    } else {
      if (!window.confirm("感谢将转赠 20 积分给评论作者，操作不可撤销。确定感谢吗？")) return;
      await bbsClient.comment.thank({ thankCommentReq: { id } });
      message.success("已感谢，已转赠 20 积分给评论作者。");
      await loadThreads(pageNumber(threadPage.value?.page), commentOrder.value);
    }
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "操作失败，请稍后重试。");
  }
}

async function acceptAnswer(commentId?: string) {
  if (!props.article.id || !commentId) return;
  try {
    await bbsClient.article.acceptAnswer({
      acceptArticleAnswerReq: { articleId: props.article.id, commentId },
    });
    message.success("回答已采纳。");
    window.location.reload();
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "采纳失败，请稍后重试。");
  }
}

async function setPinnedComment(commentId?: string) {
  if (!props.article.id) return;
  try {
    await bbsClient.article.setPinnedComment({
      setPinnedArticleCommentReq: { articleId: props.article.id, commentId },
    });
    message.success(commentId ? "评论已置顶。" : "已取消置顶。");
    await loadThreads(1, commentOrder.value);
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "设置置顶评论失败，请稍后重试。");
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
        page: pageRequest(page, 20),
        replyPreviewLimit: 3,
      },
    });
    commentOrder.value = order;
    threads.value = response.rows || [];
    acceptedAnswer.value = response.acceptedAnswer;
    pinnedComment.value = response.pinnedComment;
    threadPage.value = response.page;
    emit(
      "updated",
      pageNumber(response.page?.total, 0) +
        (response.acceptedAnswer?.thread ? 1 : 0) +
        (response.pinnedComment?.thread ? 1 : 0),
    );
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
        page: pageRequest(page, replyPageSize),
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
  <section :aria-busy="loadingThreads" class="comment-thread-list">
    <header class="comment-thread-list__header">
      <strong
        >评论 <span>{{ displayedTotal }}</span></strong
      >
      <nav aria-label="评论排序" class="comment-sort">
        <button
          :class="{ 'comment-sort__item--active': commentOrder === 'COMMENT_ORDER_HOTTEST' }"
          :disabled="loadingThreads"
          type="button"
          @click="loadThreads(1, 'COMMENT_ORDER_HOTTEST')"
        >
          最热
        </button>
        <i aria-hidden="true" />
        <button
          :class="{ 'comment-sort__item--active': commentOrder === 'COMMENT_ORDER_NEWEST' }"
          :disabled="loadingThreads"
          type="button"
          @click="loadThreads(1, 'COMMENT_ORDER_NEWEST')"
        >
          最新
        </button>
      </nav>
      <a aria-label="跳至页面底部" class="comment-thread-list__to-footer" href="#article-footer"
        ><Icon name="down"
      /></a>
    </header>

    <div class="comment__reply">
      <div v-if="account" class="fn-flex">
        <Avatar :name="account.profile?.name" :size="48" :url="account.profile?.avatarUrl" class="avatar" />
        <button class="reply__text fn-flex-1" type="button" @click="openCommentEditor()">请输入回帖内容...</button>
      </div>
      <button v-else class="reply__text fn-flex-1" type="button" @click="openCommentEditor()">登录参与讨论...</button>
    </div>

    <div v-if="acceptedAnswer?.thread || pinnedComment?.thread || threads.length" class="article-comments__list">
      <ul>
        <CommentThread
          v-if="acceptedAnswer?.thread"
          :is-article-author="acceptedAnswer.thread.root?.createdBy === article.createdBy"
          :replies-collapsed="Boolean(collapsedReplyParentIds[acceptedAnswer.thread.root?.id || ''])"
          :replies-loading="loadingReplyParentId === acceptedAnswer.thread.root?.id"
          :reply-page="replyPages[acceptedAnswer.thread.root?.id || '']"
          :thread="acceptedAnswer.thread"
          pin-label="已采纳回答"
          @collapse="collapseReplies(acceptedAnswer.thread.root?.id || '')"
          @react="reactToComment"
          @reply="openCommentEditor"
          @reveal="revealReplies(acceptedAnswer.thread)"
          @page-replies="loadReplies(acceptedAnswer.thread.root?.id || '', $event)"
        />
        <CommentThread
          v-if="pinnedComment?.thread"
          :can-accept-answer="
            Boolean(
              canAcceptAnswer &&
                !acceptedCommentID &&
                pinnedComment.thread.root?.parentId == null &&
                pinnedComment.thread.root?.createdBy !== article.createdBy,
            )
          "
          :can-pin="canPinComment"
          :is-article-author="pinnedComment.thread.root?.createdBy === article.createdBy"
          :replies-collapsed="Boolean(collapsedReplyParentIds[pinnedComment.thread.root?.id || ''])"
          :replies-loading="loadingReplyParentId === pinnedComment.thread.root?.id"
          :reply-page="replyPages[pinnedComment.thread.root?.id || '']"
          :thread="pinnedComment.thread"
          pin-label="置顶"
          @accept="acceptAnswer"
          @collapse="collapseReplies(pinnedComment.thread.root?.id || '')"
          @pin="setPinnedComment"
          @react="reactToComment"
          @reply="openCommentEditor"
          @reveal="revealReplies(pinnedComment.thread)"
          @page-replies="loadReplies(pinnedComment.thread.root?.id || '', $event)"
        />
        <CommentThread
          v-for="thread in threads"
          :key="thread.root?.id"
          :can-accept-answer="
            Boolean(
              canAcceptAnswer &&
                !acceptedCommentID &&
                thread.root?.parentId == null &&
                thread.root?.createdBy !== article.createdBy,
            )
          "
          :can-pin="canPinComment"
          :is-article-author="thread.root?.createdBy === article.createdBy"
          :replies-collapsed="Boolean(collapsedReplyParentIds[thread.root?.id || ''])"
          :replies-loading="loadingReplyParentId === thread.root?.id"
          :reply-page="replyPages[thread.root?.id || '']"
          :thread="thread"
          @accept="acceptAnswer"
          @collapse="collapseReplies(thread.root?.id || '')"
          @pin="setPinnedComment"
          @react="reactToComment"
          @reply="openCommentEditor"
          @reveal="revealReplies(thread)"
          @page-replies="loadReplies(thread.root?.id || '', $event)"
        />
      </ul>
      <nav v-if="total > pageNumber(threadPage?.size, 20)" aria-label="顶层评论分页" class="comment-root-pager">
        <button
          :disabled="pageNumber(threadPage?.page) <= 1 || loadingThreads"
          type="button"
          @click="loadThreads(pageNumber(threadPage?.page) - 1)"
        >
          上一页
        </button>
        <span>{{ pageNumber(threadPage?.page) }}</span>
        <button
          :disabled="pageNumber(threadPage?.page) * pageNumber(threadPage?.size, 20) >= total || loadingThreads"
          type="button"
          @click="loadThreads(pageNumber(threadPage?.page) + 1)"
        >
          下一页
        </button>
      </nav>
    </div>
    <p v-else-if="!loadingThreads" class="comment-thread-list__empty">还没有回复，来抢沙发吧。</p>

    <ArticleEditorPanel
      ref="editorPanelRef"
      v-model="comment.content"
      :open="editorOpen"
      :submitting="submitting"
      :title="replyComment ? `回复 ${memberDisplayName(replyComment.user, '用户')}` : article.title || '发表评论'"
      aria-label="发布回复"
      editor-name="comment"
      placeholder="友善地留下一个评论吧 :)"
      submit-label="提交"
      @close="closeCommentEditor"
      @submit="submit"
    />
  </section>
</template>

<style scoped>
:deep(.comment-thread__badge) {
  display: inline-flex;
  align-items: center;
  min-height: 18px;
  margin-inline-start: 7px;
  padding: 0 5px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--b3-theme-primary, #f3b425) 16%, transparent);
  color: var(--b3-theme-primary, #a46900);
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
}

@media (max-width: 640px) {
  :deep(.comment-thread__badge) {
    margin-inline-start: 6px;
  }
}
</style>
