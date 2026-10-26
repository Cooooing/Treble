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
import { createClientIdentifier } from "@/utils/sdk/shared";

const data = useData<Data>();
const pageContext = usePageContext();
const account = computed(() =>
  typeof window === "undefined" ? pageContext.user : pageContext.user || currentAccount.value,
);
const articleState = ref(data.article);
const replyCount = ref<number>(Number(data.comments?.page?.total || data.comments?.rows?.length || 0));
const postscripts = ref<ArticlePostscript[]>(data.postscripts || data.article?.postscripts || []);
const postscriptEditorOpen = ref(false);
const actionPending = ref<"like" | "thank" | "collect" | "watch" | "reward">();
const selectedPollOptionIDs = ref<string[]>([...(data.article?.poll?.selectedOptionIds || [])]);
const pollPending = ref(false);
const lotteryPending = ref(false);
const articleHeadings = ref<Array<{ id: string; level: number; text: string }>>([]);
const canAddPostscript = computed(() =>
  Boolean(
    account.value?.profile?.id &&
      articleState.value?.createdBy &&
      account.value.profile.id === articleState.value.createdBy,
  ),
);
const isArticleAuthor = computed(() =>
  Boolean(account.value?.profile?.id && articleState.value?.createdBy === account.value.profile.id),
);

watch(
  () => data.article,
  (article) => {
    articleState.value = article;
    postscripts.value = data.postscripts || article?.postscripts || [];
    articleHeadings.value = [];
    actionPending.value = undefined;
    lotteryPending.value = false;
    selectedPollOptionIDs.value = [...(article?.poll?.selectedOptionIds || [])];
    replyCount.value = Number(data.comments?.page?.total || data.comments?.rows?.length || 0);
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
const lotteryDrawn = computed(() => Boolean(articleState.value?.lottery?.drawnAt));
const lotteryEnded = computed(() => {
  const drawAt = articleState.value?.lottery?.drawAt;
  return Boolean(drawAt && new Date(drawAt).getTime() <= Date.now());
});
const canEnterLottery = computed(() => {
  const article = articleState.value;
  return Boolean(
    article?.lottery &&
      account.value?.profile?.id &&
      article.createdBy !== account.value.profile.id &&
      !lotteryEnded.value &&
      !lotteryDrawn.value,
  );
});

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

async function setLotteryEntry(entered: boolean) {
  const article = articleState.value;
  if (!article?.id || !canEnterLottery.value || lotteryPending.value) return;
  lotteryPending.value = true;
  try {
    await bbsClient.article.enterLottery({ enterArticleLotteryReq: { articleId: article.id, entered } });
    if (article.lottery) {
      if (article.lottery.entered !== entered)
        article.lottery.entryCount = String(Number(article.lottery.entryCount || 0) + (entered ? 1 : -1));
      article.lottery.entered = entered;
    }
    message.success(entered ? "报名成功。" : "已撤销报名。");
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "操作失败，请稍后重试。");
  } finally {
    lotteryPending.value = false;
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

async function changeArticleAction(action: "like" | "thank" | "collect" | "watch") {
  const currentArticle = articleState.value;
  if (!currentArticle?.id) return;
  if (!account.value) {
    loginForArticleAction();
    return;
  }
  if (isArticleAuthor.value) {
    message.warning("不能与自己的文章互动。");
    return;
  }
  if (actionPending.value) return;

  const actionState = currentArticle.viewerActionState || {};
  const active =
    action === "like"
      ? !actionState.liked
      : action === "thank"
        ? !actionState.thanked
        : action === "collect"
          ? !actionState.collected
          : !actionState.watched;
  actionPending.value = action;
  try {
    if (action === "like") {
      const response = await bbsClient.article.like({ likeArticleReq: { articleId: currentArticle.id, active } });
      currentArticle.viewerActionState = { ...actionState, liked: response.liked };
      currentArticle.likeCount = Math.max(0, (currentArticle.likeCount || 0) + (response.liked ? 1 : -1));
      message.success(response.liked ? "已点赞。" : "已取消点赞。");
    } else if (action === "thank") {
      if (actionState.thanked) {
        message.info("感谢已完成，不能取消。");
        return;
      }
      if (!window.confirm("感谢将转赠 20 积分给作者，操作不可撤销。确定感谢吗？")) return;
      const response = await bbsClient.article.thank({
        thankArticleReq: { articleId: currentArticle.id, clientRequestId: createClientIdentifier() },
      });
      currentArticle.viewerActionState = { ...actionState, thanked: response.thanked };
      if (response.thanked && !actionState.thanked) currentArticle.thankCount = (currentArticle.thankCount || 0) + 1;
      message.success("已感谢，已转赠 20 积分给作者。");
    } else if (action === "collect") {
      const response = await bbsClient.article.collect({ collectArticleReq: { articleId: currentArticle.id, active } });
      currentArticle.viewerActionState = { ...actionState, collected: response.collected };
      currentArticle.collectCount = Math.max(0, (currentArticle.collectCount || 0) + (response.collected ? 1 : -1));
      message.success(response.collected ? "已收藏。" : "已取消收藏。");
    } else {
      const response = await bbsClient.article.watch({ watchArticleReq: { articleId: currentArticle.id, active } });
      currentArticle.viewerActionState = { ...actionState, watched: response.watched };
      currentArticle.watchCount = Math.max(0, (currentArticle.watchCount || 0) + (response.watched ? 1 : -1));
      message.success(response.watched ? "已关注文章。" : "已取消关注文章。");
    }
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "操作失败，请稍后重试。");
  } finally {
    actionPending.value = undefined;
  }
}

async function unlockRewardContent() {
  const article = articleState.value;
  if (!article?.id || article.viewerActionState?.rewarded || actionPending.value) return;
  if (!account.value) {
    loginForArticleAction();
    return;
  }
  if (isArticleAuthor.value) return;
  const points = article.rewardPoints || 0;
  if (!window.confirm(`打赏将支付 ${points} 积分给作者，打赏后可持续查看该区域内容。确定继续吗？`)) return;

  actionPending.value = "reward";
  try {
    const response = await bbsClient.article.reward({
      rewardArticleReq: { articleId: article.id, clientRequestId: createClientIdentifier() },
    });
    if (!response.rewarded) return;
    article.viewerActionState = { ...article.viewerActionState, rewarded: true };
    article.rewardCount = (article.rewardCount || 0) + 1;
    await navigate(`/article/${article.id}`);
    message.success("打赏成功。");
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "打赏失败，请稍后重试。");
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
              data-image-preview
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
            <section v-if="articleState.hasReward" id="articleRewardContent" class="article-reward">
              <header>
                <span>{{ `${articleState.rewardPoints || 0} 积分打赏区` }}</span>
                <span>{{ articleState.rewardCount || 0 }} 人打赏</span>
              </header>
              <template v-if="articleState.rewardContentRender">
                <div class="vditor-reset" data-image-preview v-html="articleState.rewardContentRender" />
              </template>
              <template v-else>
                <p>打赏后可持续查看本段内容。</p>
                <button :disabled="actionPending === 'reward'" type="button" @click="unlockRewardContent">
                  {{ actionPending === "reward" ? "正在打赏…" : `打赏 ${articleState.rewardPoints || 0} 积分` }}
                </button>
              </template>
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
                <div v-if="articleState.poll.resultVisible" aria-hidden="true" class="article-poll__bar">
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
            <section v-if="articleState.lottery" aria-label="文章抽奖" class="article-poll article-lottery">
              <header class="article-poll__header">
                <div>
                  <h2>抽奖</h2>
                  <p>
                    {{
                      lotteryDrawn
                        ? "已开奖"
                        : `开奖时间：${new Date(articleState.lottery.drawAt || "").toLocaleString()}`
                    }}
                  </p>
                </div>
                <div class="article-poll__summary">
                  <span class="article-poll__participants">{{ articleState.lottery.entryCount || 0 }} 人报名</span>
                </div>
              </header>
              <div
                v-for="prize in articleState.lottery.prizes"
                :key="prize.id || prize.name"
                class="article-lottery__prize"
              >
                <div>
                  <strong>{{ prize.name }}</strong>
                  <small v-if="prize.description">{{ prize.description }}</small>
                </div>
                <span>{{ prize.winnerLimit }} 个名额</span>
                <p v-if="lotteryDrawn && prize.winnerUsers?.length" class="article-lottery__winners">
                  中奖者：<MemberLink
                    v-for="user in prize.winnerUsers"
                    :key="user.id"
                    :avatar="user.avatarUrl"
                    :username="user.name || ''"
                  />
                </p>
                <p v-else-if="lotteryDrawn" class="article-lottery__winners">本奖项暂无中奖者。</p>
              </div>
              <button
                v-if="canEnterLottery"
                :disabled="lotteryPending"
                class="article-poll__submit"
                type="button"
                @click="setLotteryEntry(!articleState.lottery.entered)"
              >
                {{ lotteryPending ? "正在处理…" : articleState.lottery.entered ? "撤销报名" : "报名抽奖" }}
              </button>
              <p v-else-if="!account" class="ft-fade">登录后即可参与抽奖。</p>
              <p v-else-if="canAddPostscript" class="ft-fade">作者不能参与自己的抽奖。</p>
              <p v-else-if="lotteryEnded && !lotteryDrawn" class="ft-fade">抽奖正在开奖，请稍后刷新查看结果。</p>
            </section>
          </div>
        </div>
        <div class="article-tail">
          <div class="wrapper">
            <div class="article-tail__taxonomy">
              <ArticleTaxonomy :domains="articleState.domains" :tags="articleState.tags" />
            </div>
            <div class="article-tail__author">
              <Author :article="articleState" :reply-count="replyCount" />
            </div>
          </div>
        </div>
        <main class="main article-discussion">
          <div id="articleCommentsPanel" class="wrapper">
            <section id="comments" class="comments module">
              <Comments
                :key="articleState.id"
                :article="articleState"
                :can-accept-answer="Boolean(canAddPostscript && articleState.type === 'ARTICLE_TYPE_QA')"
                :comments="data.comments"
                :is-author="canAddPostscript"
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
          class="share__item share__item--count"
          title="点赞"
          type="button"
          @click="changeArticleAction('like')"
        >
          <Icon name="thumbs-up" /><span class="share__count">{{ articleState.likeCount || 0 }}</span>
        </button>
        <button
          :class="{ 'share__button--active': articleState.viewerActionState?.thanked }"
          :disabled="actionPending === 'thank'"
          class="share__item share__item--count"
          title="感谢"
          type="button"
          @click="changeArticleAction('thank')"
        >
          <Icon name="heart" /><span class="share__count">{{ articleState.thankCount || 0 }}</span>
        </button>
        <button
          :class="{ 'share__button--active': articleState.viewerActionState?.collected }"
          :disabled="actionPending === 'collect'"
          class="share__item share__item--count"
          title="收藏"
          type="button"
          @click="changeArticleAction('collect')"
        >
          <Icon name="star" /><span class="share__count">{{ articleState.collectCount || 0 }}</span>
        </button>
        <button
          :class="{ 'share__button--active': articleState.viewerActionState?.watched }"
          :disabled="actionPending === 'watch'"
          :title="articleState.viewerActionState?.watched ? '取消关注文章' : '关注文章'"
          class="share__item share__item--count"
          type="button"
          @click="changeArticleAction('watch')"
        >
          <Icon name="view" /><span class="share__count">{{ articleState.watchCount || 0 }}</span>
        </button>
        <button class="share__item share__item--utility" title="复制文章链接" type="button" @click="copyArticleLink">
          <Icon name="link" /><span aria-hidden="true" class="share__count" />
        </button>
        <a aria-label="参与讨论" class="share__item share__item--utility" href="#comments" title="参与讨论">
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
.article-lottery__prize {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 16px;
  padding: 12px;
  border: 1px solid var(--layer-border-color);
  border-radius: 3px;
  background: var(--background-color);
}
.article-lottery__prize strong,
.article-lottery__prize small {
  display: block;
}
.article-lottery__prize small,
.article-lottery__prize > span,
.article-lottery__winners {
  color: var(--text-fade-color);
  font-size: 12px;
}
.article-lottery__prize > span {
  white-space: nowrap;
}
.article-lottery__winners {
  grid-column: 1 / -1;
  margin: 4px 0 0;
}
.article-lottery__winners :deep(a) {
  margin-left: 6px;
}
.article-reward {
  display: grid;
  gap: 12px;
  margin-top: 20px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--primary-color) 25%, var(--layer-border-color));
  border-radius: 4px;
  background: color-mix(in srgb, var(--primary-color) 4%, var(--background-color));
}
.article-reward header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-fade-color);
  font-size: 13px;
}
.article-reward header span:first-child {
  color: var(--text-color);
  font-weight: 600;
}
.article-reward p {
  margin: 0;
  color: var(--text-fade-color);
}
.article-reward button {
  justify-self: start;
  min-height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 3px;
  background: var(--primary-color);
  color: #fff;
  cursor: pointer;
}
.article-reward button:disabled {
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
