<script lang="ts" setup>
import type { ListCommentRepliesResp } from "@bass/bbs-sdk-fetch/models/ListCommentRepliesResp";
import type { RespCommentListItem } from "@bass/bbs-sdk-fetch/models/RespCommentListItem";
import type { RespCommentThread } from "@bass/bbs-sdk-fetch/models/RespCommentThread";
import Avatar from "@/components/identity/Avatar.vue";
import MemberLink from "@/components/identity/MemberLink.vue";
import Icon from "@/components/ui/Icon.vue";
import { fromNow } from "@/utils/date";
import { memberDisplayName } from "@/utils/member";
import { pageNumber } from "@/utils/page";

const props = defineProps<{
  thread: RespCommentThread;
  pinLabel?: string;
  isArticleAuthor?: boolean;
  canAcceptAnswer?: boolean;
  canPin?: boolean;
  replyPage?: ListCommentRepliesResp;
  repliesCollapsed?: boolean;
  repliesLoading?: boolean;
}>();
const emit = defineEmits<{
  reply: [comment: RespCommentListItem];
  react: [action: "like" | "thank", id?: string];
  accept: [id?: string];
  pin: [id?: string];
  reveal: [];
  collapse: [];
  pageReplies: [page: number];
}>();

const replyPageSize = 10;

function displayedReplies() {
  if (props.repliesCollapsed) return [];
  return props.replyPage?.rows || props.thread.previewReplies || [];
}

function repliesFullyExpanded() {
  return Boolean(props.replyPage) || displayedReplies().length >= (props.thread.replyCount || 0);
}

function totalReplyPages() {
  const total = pageNumber(props.replyPage?.page?.total, props.thread.replyCount || 0);
  return Math.max(1, Math.ceil(total / replyPageSize));
}

function pageNumbers(total: number, current: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}
</script>

<template>
  <li v-if="thread.root" :class="{ 'comment-thread--top': pinLabel }" class="article-comment comment-thread">
    <div :id="`comment_${thread.root.id}`" class="comment-thread__root fn-flex">
      <MemberLink :username="thread.root.user?.name || ''">
        <Avatar :name="thread.root.user?.name" :size="48" :url="thread.root.user?.avatarUrl" square />
      </MemberLink>
      <div class="fn-flex-1">
        <div class="comment-info">
          <MemberLink :username="thread.root.user?.name || ''" class="ft-gray">
            {{ memberDisplayName(thread.root.user) }}
          </MemberLink>
          <span v-if="isArticleAuthor" class="comment-thread__badge">作者</span>
          <span v-if="pinLabel" class="comment-thread__badge">{{ pinLabel }}</span>
        </div>
        <section
          class="vditor-reset comment"
          data-image-preview
          v-html="thread.root.contentRender || thread.root.content"
        />
        <footer class="comment-thread__action">
          <span class="ft-fade">{{ thread.root.createdAt ? fromNow(thread.root.createdAt) : "刚刚" }}</span>
          <span class="comment-thread__action-buttons">
            <button type="button" @click="emit('react', 'like', thread.root?.id)">
              <Icon name="thumbs-up" /> {{ thread.root.likeCount || 0 }}
            </button>
            <button type="button" @click="emit('react', 'thank', thread.root?.id)">
              <Icon name="heart" /> {{ thread.root.thankCount || 0 }}
            </button>
            <button type="button" @click="emit('reply', thread.root)"><Icon name="reply" /> 回复</button>
            <button v-if="canAcceptAnswer" type="button" @click="emit('accept', thread.root.id)">采纳回答</button>
            <button v-if="pinLabel && canPin" type="button" @click="emit('pin')">取消置顶</button>
            <button v-else-if="canPin" type="button" @click="emit('pin', thread.root.id)">置顶评论</button>
          </span>
        </footer>
      </div>
    </div>
    <section v-if="thread.replyCount" class="comment-thread__replies">
      <template v-if="!repliesCollapsed">
        <article v-for="reply in displayedReplies()" :key="reply.id" class="comment-thread__reply">
          <MemberLink :username="reply.user?.name || ''"
            ><Avatar :name="reply.user?.name" :size="24" :url="reply.user?.avatarUrl" square
          /></MemberLink>
          <div class="fn-flex-1">
            <div class="comment-thread__reply-content" data-image-preview>
              <MemberLink :username="reply.user?.name || ''" class="comment-thread__user">{{
                memberDisplayName(reply.user)
              }}</MemberLink>
              <span v-if="reply.replyUser && reply.replyId !== thread.root.id" class="comment-thread__target"
                >回复
                <MemberLink :username="reply.replyUser.name || ''">{{
                  memberDisplayName(reply.replyUser)
                }}</MemberLink
                >：</span
              >
              <span v-html="reply.contentRender || reply.content" />
            </div>
            <footer class="comment-thread__action">
              <span>{{ reply.createdAt ? fromNow(reply.createdAt) : "刚刚" }}</span
              ><span class="comment-thread__action-buttons"
                ><button type="button" @click="emit('react', 'like', reply.id)">
                  <Icon name="thumbs-up" /> {{ reply.likeCount || 0 }}</button
                ><button type="button" @click="emit('react', 'thank', reply.id)">
                  <Icon name="heart" /> {{ reply.thankCount || 0 }}</button
                ><button type="button" @click="emit('reply', reply)"><Icon name="reply" /> 回复</button></span
              >
            </footer>
          </div>
        </article>
      </template>
      <div class="comment-thread__reply-controls">
        <template v-if="repliesCollapsed || !repliesFullyExpanded()"
          ><span>共 {{ thread.replyCount }} 条回复，</span
          ><button :disabled="repliesLoading" class="comment-thread__toggle" type="button" @click="emit('reveal')">
            点击查看
          </button></template
        >
        <template v-else>
          <nav
            v-if="totalReplyPages() > 1"
            :aria-label="`评论 ${thread.root.id} 的回复分页`"
            class="comment-thread__pager"
          >
            <span>共 {{ totalReplyPages() }} 页</span
            ><button
              v-if="pageNumber(replyPage?.page?.page) > 1"
              :disabled="repliesLoading"
              type="button"
              @click="emit('pageReplies', pageNumber(replyPage?.page?.page) - 1)"
            >
              上一页</button
            ><template
              v-for="(item, index) in pageNumbers(totalReplyPages(), pageNumber(replyPage?.page?.page))"
              :key="`${item}-${index}`"
              ><span v-if="item === '...'" aria-hidden="true">...</span
              ><button
                v-else
                :aria-current="item === pageNumber(replyPage?.page?.page) ? 'page' : undefined"
                :class="{ 'comment-thread__page--current': item === pageNumber(replyPage?.page?.page) }"
                :disabled="repliesLoading"
                type="button"
                @click="emit('pageReplies', item)"
              >
                {{ item }}
              </button></template
            ><button
              v-if="pageNumber(replyPage?.page?.page) < totalReplyPages()"
              :disabled="repliesLoading"
              type="button"
              @click="emit('pageReplies', pageNumber(replyPage?.page?.page) + 1)"
            >
              下一页
            </button>
          </nav>
          <button class="comment-thread__toggle" type="button" @click="emit('collapse')">收起</button>
        </template>
      </div>
    </section>
  </li>
</template>
