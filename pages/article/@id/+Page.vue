<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { navigate } from "vike/client/router";
import type { ArticlePostscript } from "@bass/bbs-sdk-fetch/models/ArticlePostscript";
import { useData } from "vike-vue/useData";
import { usePageContext } from "vike-vue/usePageContext";
import { message } from "@/components/feedback/message";
import { Data } from "./+data";
import MarkdownRenderer from "@/components/content/MarkdownRenderer.vue";
import Author from "./Author.vue";
import Comments from "./Comments.vue";
import Postscripts from "./Postscripts.vue";
import Icon from "@/components/ui/Icon.vue";
import ArticleTaxonomy from "@/components/article/ArticleTaxonomy.vue";
import Avatar from "@/components/identity/Avatar.vue";
import MemberLink from "@/components/identity/MemberLink.vue";
import AppLink from "@/components/ui/AppLink.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";
import { currentAccount } from "@/services/sessionState";
import { bbsClient } from "@/utils/sdk";

const data = useData<Data>();
const pageContext = usePageContext();
const account = computed(() =>
  typeof window === "undefined" ? pageContext.user : pageContext.user || currentAccount.value,
);
const articleState = ref(data.article);
const replyCount = ref(data.comments?.page?.total || data.comments?.rows?.length || 0);
const postscripts = ref<ArticlePostscript[]>(data.postscripts || data.article?.postscripts || []);
const postscriptEditorOpen = ref(false);
const actionPending = ref<"like" | "thank" | "collect">();
const selectedPollOptionIDs = ref<string[]>([...(data.article?.poll?.selectedOptionIds || [])]);
const pollPending = ref(false);
const articleHeadings = ref<Array<{ id: string; level: number; text: string }>>([]);
const canAddPostscript = computed(() =>
  Boolean(
    account.value?.profile?.id &&
      articleState.value?.createdBy &&
      account.value.profile.id === articleState.value.createdBy,
  ),
);

watch(
  () => data.article,
  (article) => {
    articleState.value = article;
    postscripts.value = data.postscripts || article?.postscripts || [];
    articleHeadings.value = [];
    actionPending.value = undefined;
    selectedPollOptionIDs.value = [...(article?.poll?.selectedOptionIds || [])];
    replyCount.value = data.comments?.page?.total || data.comments?.rows?.length || 0;
  },
);

function addPostscript(postscript: ArticlePostscript) {
  postscripts.value = [...postscripts.value, postscript];
  if (articleState.value) articleState.value.hasPostscript = true;
}

function updateReplyCount(total: number) {
  replyCount.value = total;
}

const pollEnded = computed(() => {
  const endsAt = articleState.value?.poll?.endsAt;
  return Boolean(endsAt && new Date(endsAt).getTime() <= Date.now());
});
const canVotePoll = computed(() => {
  const article = articleState.value;
  return Boolean(
    article?.poll &&
      account.value?.profile?.id &&
      article.createdBy !== account.value.profile.id &&
      !pollEnded.value &&
      !article.poll.selectedOptionIds?.length,
  );
});
const pollVoteTotal = computed(() => Number(articleState.value?.poll?.totalVoteCount || 0));

function pollOptionPercent(voteCount?: number) {
  if (!pollVoteTotal.value) return 0;
  return Math.round(((voteCount || 0) / pollVoteTotal.value) * 10000) / 100;
}

function isSelectedPollOption(optionID?: string) {
  return Boolean(optionID && selectedPollOptionIDs.value.includes(optionID));
}

function togglePollOption(optionID: string) {
  const poll = articleState.value?.poll;
  if (!poll || pollPending.value) return;
  if (poll.maxChoices === 1) {
    selectedPollOptionIDs.value = [optionID];
    return;
  }
  if (selectedPollOptionIDs.value.includes(optionID)) {
    selectedPollOptionIDs.value = selectedPollOptionIDs.value.filter((item) => item !== optionID);
  } else if (selectedPollOptionIDs.value.length < (poll.maxChoices || 1)) {
    selectedPollOptionIDs.value = [...selectedPollOptionIDs.value, optionID];
  }
}

async function votePoll() {
  const article = articleState.value;
  if (!article?.id || !canVotePoll.value || !selectedPollOptionIDs.value.length) return;
  pollPending.value = true;
  try {
    await bbsClient.article.votePoll({
      voteArticlePollReq: { articleId: article.id, optionIds: selectedPollOptionIDs.value },
    });
    const poll = article.poll;
    if (poll) {
      poll.selectedOptionIds = [...selectedPollOptionIDs.value];
      poll.resultVisible = true;
      poll.participantCount = String(Number(poll.participantCount || 0) + 1);
      poll.totalVoteCount = String(Number(poll.totalVoteCount || 0) + selectedPollOptionIDs.value.length);
      poll.options?.forEach((option) => {
        if (option.id && selectedPollOptionIDs.value.includes(option.id))
          option.voteCount = (option.voteCount || 0) + 1;
      });
    }
    message.success("投票成功。");
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "投票失败，请稍后重试。");
  } finally {
    pollPending.value = false;
  }
}

function loginForArticleAction() {
  void navigate(`/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
}

function scrollToHeading(id: string) {
  const heading = document.getElementById(id);
  if (!heading) return;
  const navigationHeight = 58;
  window.scrollTo({
    top: window.scrollY + heading.getBoundingClientRect().top - navigationHeight - 16,
    behavior: "smooth",
  });
  window.history.replaceState(null, "", `#${encodeURIComponent(id)}`);
}

async function changeArticleAction(action: "like" | "thank" | "collect") {
  const currentArticle = articleState.value;
  if (!currentArticle?.id) return;
  if (!account.value) {
    loginForArticleAction();
    return;
  }
  if (actionPending.value) return;

  const actionState = currentArticle.viewerActionState || {};
  const active =
    action === "like" ? !actionState.liked : action === "thank" ? !actionState.thanked : !actionState.collected;
  actionPending.value = action;
  try {
    if (action === "like") {
      const response = await bbsClient.article.like({ likeArticleReq: { articleId: currentArticle.id, active } });
      currentArticle.viewerActionState = { ...actionState, liked: response.liked };
      currentArticle.likeCount = Math.max(0, (currentArticle.likeCount || 0) + (response.liked ? 1 : -1));
    } else if (action === "thank") {
      const response = await bbsClient.article.thank({ thankArticleReq: { articleId: currentArticle.id, active } });
      currentArticle.viewerActionState = { ...actionState, thanked: response.thanked };
      currentArticle.thankCount = Math.max(0, (currentArticle.thankCount || 0) + (response.thanked ? 1 : -1));
    } else {
      const response = await bbsClient.article.collect({ collectArticleReq: { articleId: currentArticle.id, active } });
      currentArticle.viewerActionState = { ...actionState, collected: response.collected };
      currentArticle.collectCount = Math.max(0, (currentArticle.collectCount || 0) + (response.collected ? 1 : -1));
    }
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "操作失败，请稍后重试。");
  } finally {
    actionPending.value = undefined;
  }
}

async function copyArticleLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    message.success("文章链接已复制。");
  } catch {
    message.warning("当前浏览器无法复制链接，请从地址栏复制。");
  }
}

onMounted(() => {
  if (!data.article || !data.comments) message.error(data.error || "文章不存在或暂时无法访问。");
});
</script>

<template>
  <div v-if="articleState && data.comments" class="article article-page">
    <div class="article-layout">
      <aside v-if="articleHeadings.length" id="articleToC" aria-label="文章目录" class="module">
        <nav class="module-panel article-toc">
          <a
            v-for="heading in articleHeadings"
            :key="heading.id"
            :class="`toc-h${heading.level}`"
            :href="`#${heading.id}`"
            @click.prevent="scrollToHeading(heading.id)"
            >{{ heading.text }}</a
          >
        </nav>
      </aside>
      <article class="article-container">
        <div class="article-body">
          <div class="wrapper">
            <h1 id="article-title" class="article-title">{{ articleState.title }}</h1>
            <div v-if="articleState.statement" class="article-statement">{{ articleState.statement }}</div>
            <MarkdownRenderer
              :key="data.article?.id"
              :html="articleState.contentRender"
              :md="articleState.content || ''"
              class="vditor-reset article-content"
              @rendered="articleHeadings = $event"
            />
            <Postscripts
              v-model:editor-open="postscriptEditorOpen"
              :article-id="articleState.id || ''"
              :postscripts="postscripts"
              @added="addPostscript"
            />
            <section v-if="canAddPostscript" aria-label="作者操作" class="article-author-actions">
              <button type="button" @click="postscriptEditorOpen = true">添加附言</button>
            </section>
            <section v-if="articleState.hasReward && articleState.rewardContentRender" id="articleRewardContent">
              <span>{{ articleState.rewardPoints || 0 }} 积分悬赏</span>
              <div class="vditor-reset" v-html="articleState.rewardContentRender" />
            </section>
            <section v-if="articleState.poll" aria-label="文章投票" class="article-poll">
              <header class="article-poll__header">
                <div>
                  <h2>投票</h2>
                  <p>截止至 {{ new Date(articleState.poll.endsAt || "").toLocaleString() }}</p>
                </div>
                <div class="article-poll__summary">
                  <span v-if="articleState.poll.resultVisible" class="article-poll__participants"
                    >{{ articleState.poll.participantCount || 0 }} 人参与 · {{ pollVoteTotal }} 票</span
                  >
                  <span class="article-poll__limit">最多选 {{ articleState.poll.maxChoices }} 项</span>
                </div>
              </header>
              <p v-if="!articleState.poll.resultVisible" class="ft-fade">投票后或截止后可查看结果。</p>
              <div
                v-for="option in articleState.poll.options"
                :key="option.id"
                :class="{
                  'article-poll__option--selected': isSelectedPollOption(option.id),
                  'article-poll__option--result': articleState.poll.resultVisible,
                }"
                class="article-poll__option"
              >
                <div v-if="articleState.poll.resultVisible" class="article-poll__bar" aria-hidden="true">
                  <span :style="{ width: `${pollOptionPercent(option.voteCount)}%` }" />
                </div>
                <label class="article-poll__choice">
                  <input
                    :checked="isSelectedPollOption(option.id)"
                    :disabled="!canVotePoll"
                    :type="articleState.poll.maxChoices === 1 ? 'radio' : 'checkbox'"
                    @change="option.id && togglePollOption(option.id)"
                  />
                  <span>{{ option.content }}</span>
                </label>
                <span v-if="articleState.poll.resultVisible" class="article-poll__result">
                  <strong>{{ pollOptionPercent(option.voteCount) }}%</strong>
                  <small>{{ option.voteCount || 0 }} 票</small>
                </span>
              </div>
              <button
                v-if="canVotePoll"
                :disabled="pollPending || !selectedPollOptionIDs.length"
                class="article-poll__submit"
                type="button"
                @click="votePoll"
              >
                {{ pollPending ? "正在提交…" : "投票" }}
              </button>
              <p v-else-if="!account" class="ft-fade">登录后即可参与投票。</p>
              <p v-else-if="pollEnded" class="ft-fade">投票已截止。</p>
            </section>
          </div>
        </div>
        <div class="article-tail">
          <div class="wrapper">
            <Author :article="articleState" :reply-count="replyCount" />
            <ArticleTaxonomy :domains="articleState.domains" :tags="articleState.tags" />
          </div>
        </div>
        <main class="main article-discussion">
          <div id="articleCommentsPanel" class="wrapper">
            <section id="comments" class="comments module">
              <Comments
                :key="articleState.id"
                :article="articleState"
                :comments="data.comments"
                :is-author="canAddPostscript"
                :can-accept-answer="Boolean(canAddPostscript && articleState.type === 'ARTICLE_TYPE_QA')"
                @updated="updateReplyCount"
              />
            </section>
          </div>
        </main>

        <section id="article-footer" aria-label="延伸阅读" class="wrapper article-footer">
          <section class="module">
            <header class="module-header"><h2>最新文章</h2></header>
            <div class="module-panel">
              <ul class="module-list article-footer__list">
                <li v-for="item in data.latest || []" :key="item.id">
                  <MemberLink :username="item.authorUser?.name || ''">
                    <Avatar :name="item.authorUser?.name" :size="20" :url="item.authorUser?.avatarUrl" square />
                  </MemberLink>
                  <AppLink :href="`/article/${item.id}`" class="title fn-ellipsis">{{
                    item.title || "未命名文章"
                  }}</AppLink>
                </li>
              </ul>
            </div>
          </section>
          <section class="module">
            <header class="module-header"><h2>随便看看</h2></header>
            <div class="module-panel">
              <ul class="module-list article-footer__list">
                <li v-for="item in data.hottest || []" :key="item.id">
                  <MemberLink :username="item.authorUser?.name || ''">
                    <Avatar :name="item.authorUser?.name" :size="20" :url="item.authorUser?.avatarUrl" square />
                  </MemberLink>
                  <AppLink :href="`/article/${item.id}`" class="title fn-ellipsis">{{
                    item.title || "未命名文章"
                  }}</AppLink>
                </li>
              </ul>
            </div>
          </section>
        </section>
      </article>
      <aside aria-label="文章互动" class="share">
        <button
          :class="{ 'share__button--active': articleState.viewerActionState?.liked }"
          :disabled="actionPending === 'like'"
          class="share__item"
          title="点赞"
          type="button"
          @click="changeArticleAction('like')"
        >
          <Icon name="thumbs-up" /><span class="share__count">{{ articleState.likeCount || 0 }}</span>
        </button>
        <button
          :class="{ 'share__button--active': articleState.viewerActionState?.thanked }"
          :disabled="actionPending === 'thank'"
          class="share__item"
          title="感谢"
          type="button"
          @click="changeArticleAction('thank')"
        >
          <Icon name="heart" /><span class="share__count">{{ articleState.thankCount || 0 }}</span>
        </button>
        <button
          :class="{ 'share__button--active': articleState.viewerActionState?.collected }"
          :disabled="actionPending === 'collect'"
          class="share__item"
          title="收藏"
          type="button"
          @click="changeArticleAction('collect')"
        >
          <Icon name="star" /><span class="share__count">{{ articleState.collectCount || 0 }}</span>
        </button>
        <button class="share__item share__item--unavailable" disabled title="关注文章暂未开放" type="button">
          <Icon name="view" /><span aria-hidden="true" class="share__count" />
        </button>
        <button class="share__item" title="复制文章链接" type="button" @click="copyArticleLink">
          <Icon name="link" /><span aria-hidden="true" class="share__count" />
        </button>
        <a aria-label="参与讨论" class="share__item" href="#comments" title="参与讨论">
          <Icon name="reply" /><span aria-hidden="true" class="share__count" />
        </a>
      </aside>
    </div>
  </div>
  <ErrorState
    v-else
    :message="data.error || '文章暂时无法访问。'"
    :title="data.pageStatus === 404 ? '文章未找到' : '文章暂时无法打开'"
  />
</template>

<style scoped>
.article-poll {
  display: grid;
  gap: 10px;
  margin-top: 24px;
  padding: 18px;
  border: 1px solid var(--layer-border-color);
  border-radius: 4px;
  background: var(--layer-background-color);
}
.article-author-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.article-poll__header,
.article-poll__option,
.article-poll__choice {
  display: flex;
  align-items: center;
}
.article-poll__header {
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 4px;
}
.article-poll__header h2,
.article-poll__header p {
  margin: 0;
}
.article-poll__header h2 {
  color: var(--text-color);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.35;
}
.article-poll__header p,
.article-poll__result small {
  color: var(--text-fade-color);
  font-size: 12px;
}
.article-poll__header p {
  margin-top: 3px;
  line-height: 1.45;
}
.article-poll__summary {
  display: grid;
  justify-items: end;
  gap: 4px;
  flex: 0 0 auto;
  text-align: right;
  white-space: nowrap;
}
.article-poll__participants {
  color: var(--text-color);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.35;
}
.article-poll__limit {
  color: var(--text-fade-color);
  font-size: 11px;
  line-height: 1.35;
}
.article-poll__option {
  position: relative;
  min-height: 44px;
  justify-content: space-between;
  overflow: hidden;
  border: 1px solid var(--layer-border-color);
  border-radius: 3px;
  background: var(--background-color);
}
.article-poll__option--selected {
  background: color-mix(in srgb, var(--primary-color) 6%, var(--background-color));
}
.article-poll__option--result {
  cursor: default;
}
.article-poll__bar {
  position: absolute;
  inset: 0;
  background: rgba(128, 128, 128, 0.06);
}
.article-poll__bar span {
  display: block;
  height: 100%;
  background: rgba(128, 128, 128, 0.14);
  transition: width 0.35s ease-out;
}
.article-poll__option--selected .article-poll__bar {
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
}
.article-poll__option--selected .article-poll__bar span {
  background: color-mix(in srgb, var(--primary-color) 28%, transparent);
}
.article-poll__option--selected .article-poll__result strong,
.article-poll__option--selected .article-poll__choice span {
  color: var(--primary-color);
}
.article-poll__choice,
.article-poll__result {
  position: relative;
  z-index: 1;
}
.article-poll__choice {
  flex: 1 1 auto;
  min-width: 0;
  gap: 9px;
  padding: 10px 12px;
  cursor: pointer;
}
.article-poll__choice input {
  flex: 0 0 auto;
  accent-color: var(--primary-color);
}
.article-poll__choice input:disabled {
  cursor: default;
}
.article-poll__result {
  display: grid;
  justify-items: end;
  gap: 1px;
  min-width: 64px;
  padding: 7px 12px 7px 0;
}
.article-poll__result strong {
  color: var(--text-color);
  font-size: 13px;
}
.article-poll__submit {
  justify-self: end;
  min-width: 88px;
  min-height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 3px;
  background: var(--primary-color);
  color: #fff;
}
.article-poll__submit:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
@media (max-width: 640px) {
  .article-poll {
    margin-top: 16px;
    padding: 14px;
  }
  .article-poll__result {
    min-width: 56px;
    padding-right: 10px;
  }
}
</style>
