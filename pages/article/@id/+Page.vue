<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { ArticlePostscript } from "@bass/bbs-sdk-fetch/models/ArticlePostscript";
import { useData } from "vike-vue/useData";
import { usePageContext } from "vike-vue/usePageContext";
import { message } from "@/components/Message";
import { Data } from "./+data";
import MdRender from "@/components/MdRender";
import Author from "./Author.vue";
import Comments from "./Comments.vue";
import Postscripts from "./Postscripts.vue";
import Icon from "@/components/community/Icon.vue";
import Avatar from "@/components/Avatar";
import { currentAccount } from "@/utils/auth/state";
import { bbsClient } from "@/utils/sdk";

const data = useData<Data>();
const pageContext = usePageContext();
const account = computed(() => typeof window === "undefined" ? pageContext.user : pageContext.user || currentAccount.value);
const articleState = ref(data.article);
const postscripts = ref<ArticlePostscript[]>(data.postscripts || data.article?.postscripts || []);
const postscriptEditorOpen = ref(false);
const actionPending = ref<"like" | "thank" | "collect">();
const articleHeadings = ref<Array<{ id: string; level: number; text: string }>>([]);
const canAddPostscript = computed(() => Boolean(
  account.value?.profile?.id
  && articleState.value?.createdBy
  && account.value.profile.id === articleState.value.createdBy,
));

watch(
  () => data.article,
  (article) => {
    articleState.value = article;
    postscripts.value = data.postscripts || article?.postscripts || [];
    articleHeadings.value = [];
    actionPending.value = undefined;
  },
);

function addPostscript(postscript: ArticlePostscript) {
  postscripts.value = [...postscripts.value, postscript];
  if (articleState.value) articleState.value.hasPostscript = true;
}

function loginForArticleAction() {
  window.location.assign(`/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
}

function scrollToHeading(id: string) {
  const heading = document.getElementById(id);
  if (!heading) return;
  const navigationHeight = 58;
  window.scrollTo({ top: window.scrollY + heading.getBoundingClientRect().top - navigationHeight - 16, behavior: "smooth" });
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
      <aside v-if="articleHeadings.length" id="articleToC" class="module" aria-label="文章目录">
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
            <MdRender
              :key="data.article?.id"
              class="vditor-reset article-content"
              :md="articleState.content || ''"
              :html="articleState.contentRender"
              @rendered="articleHeadings = $event"
            />
            <section v-if="articleState.hasReward && articleState.rewardContentRender" id="articleRewardContent">
              <span>{{ articleState.rewardPoints || 0 }} 积分悬赏</span>
              <div class="vditor-reset" v-html="articleState.rewardContentRender" />
            </section>
          </div>
        </div>
        <Postscripts
          :article-id="articleState.id || ''"
          :postscripts="postscripts"
          v-model:editor-open="postscriptEditorOpen"
          @added="addPostscript"
        />
        <section v-if="canAddPostscript" class="article-author-actions" aria-label="作者操作">
          <div class="wrapper">
              <button type="button" @click="postscriptEditorOpen = true">添加附言</button>
          </div>
        </section>
        <div class="article-tail">
          <div class="wrapper">
              <Author
                :article="articleState"
                :reply-count="data.comments.page?.total || data.comments.rows?.length || 0"
              />
          </div>
        </div>
        <main class="main article-discussion">
          <div id="articleCommentsPanel" class="wrapper">
            <section id="comments" class="comments module">
              <Comments :key="articleState.id" :comments="data.comments" :article="articleState" />
            </section>
          </div>
        </main>

        <section id="article-footer" class="wrapper article-footer" aria-label="延伸阅读">
          <section class="module">
            <header class="module-header"><h2>最新文章</h2></header>
            <div class="module-panel">
              <ul class="module-list article-footer__list">
                <li v-for="item in data.latest || []" :key="item.id">
                  <a :href="`/article/${item.id}`"
                    ><Avatar :url="item.authorUser?.avatarUrl" :name="item.authorUser?.name" :size="20"
                  /></a>
                  <a class="title fn-ellipsis" :href="`/article/${item.id}`">{{ item.title || "未命名文章" }}</a>
                </li>
              </ul>
            </div>
          </section>
          <section class="module">
            <header class="module-header"><h2>随便看看</h2></header>
            <div class="module-panel">
              <ul class="module-list article-footer__list">
                <li v-for="item in data.hottest || []" :key="item.id">
                  <a :href="`/article/${item.id}`"
                    ><Avatar :url="item.authorUser?.avatarUrl" :name="item.authorUser?.name" :size="20"
                  /></a>
                  <a class="title fn-ellipsis" :href="`/article/${item.id}`">{{ item.title || "未命名文章" }}</a>
                </li>
              </ul>
            </div>
          </section>
        </section>
      </article>
      <aside class="share" aria-label="文章互动">
        <button
          class="share__item"
          type="button"
          title="点赞"
          :class="{ 'share__button--active': articleState.viewerActionState?.liked }"
          :disabled="actionPending === 'like'"
          @click="changeArticleAction('like')"
        >
          <Icon name="thumbs-up" /><span class="share__count">{{ articleState.likeCount || 0 }}</span>
        </button>
        <button
          class="share__item"
          type="button"
          title="感谢"
          :class="{ 'share__button--active': articleState.viewerActionState?.thanked }"
          :disabled="actionPending === 'thank'"
          @click="changeArticleAction('thank')"
        >
          <Icon name="heart" /><span class="share__count">{{ articleState.thankCount || 0 }}</span>
        </button>
        <button
          class="share__item"
          type="button"
          title="收藏"
          :class="{ 'share__button--active': articleState.viewerActionState?.collected }"
          :disabled="actionPending === 'collect'"
          @click="changeArticleAction('collect')"
        >
          <Icon name="star" /><span class="share__count">{{ articleState.collectCount || 0 }}</span>
        </button>
        <button class="share__item share__item--unavailable" type="button" title="关注文章暂未开放" disabled>
          <Icon name="view" /><span class="share__count" aria-hidden="true" />
        </button>
        <button class="share__item" type="button" title="复制文章链接" @click="copyArticleLink">
          <Icon name="link" /><span class="share__count" aria-hidden="true" />
        </button>
        <a class="share__item" href="#comments" title="参与讨论" aria-label="参与讨论">
          <Icon name="reply" /><span class="share__count" aria-hidden="true" />
        </a>
      </aside>
    </div>
  </div>
  <div v-else class="main">
    <div class="wrapper">
      <section class="content module">
        <div class="module-panel">
          <a class="btn" href="/recent">返回最新文章</a>
        </div>
      </section>
    </div>
  </div>
</template>
