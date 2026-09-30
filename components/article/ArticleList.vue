<script lang="ts" setup>
import type { ArticleListItem } from "@bass/bbs-sdk-fetch/models/ArticleListItem";
import Avatar from "@/components/identity/Avatar.vue";
import AppLink from "@/components/ui/AppLink.vue";
import { fromNow } from "@/utils/date";
import ArticleTaxonomy from "./ArticleTaxonomy.vue";

defineProps<{ articles: ArticleListItem[]; compact?: boolean }>();

function formatCount(value: number | undefined): string {
  const count = Math.max(0, Math.trunc(value ?? 0));

  for (const [threshold, suffix] of [
    [1_000_000_000, "b"],
    [1_000_000, "m"],
    [1_000, "k"],
  ] as const) {
    if (count < threshold) continue;

    const compact = Math.floor((count * 10) / threshold) / 10;
    return `${Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(1)}${suffix}`;
  }

  return String(count);
}
</script>

<template>
  <div :class="{ 'article-list--compact': compact }" class="article-list list">
    <ul>
      <li v-for="article in articles" :key="article.id">
        <template v-if="compact">
          <div class="article-list__compact-row">
            <AppLink
              :aria-label="`${article.authorUser?.nickname || article.authorUser?.name || '用户'}的头像`"
              :href="`/article/${article.id}`"
            >
              <Avatar
                :name="article.authorUser?.name"
                :size="32"
                :url="article.authorUser?.avatarUrl"
                class="avatar-small slogan"
              />
            </AppLink>
            <div class="article-list__compact-details fn-flex-1">
              <AppLink :href="`/article/${article.id}`" class="title fn-ellipsis">{{
                article.title || "未命名文章"
              }}</AppLink>
            </div>
            <AppLink
              :aria-label="`${article.replyCount || 0} 条回复`"
              :href="`/article/${article.id}#comments`"
              class="article-list__reply-link"
            >
              <span class="count ft-gray ft-smaller">{{ formatCount(article.replyCount) }}</span>
            </AppLink>
          </div>
        </template>
        <template v-else>
          <div class="article-list__headline">
            <div class="article-list__headline-main">
              <ArticleTaxonomy
                v-if="article.domains?.length || article.tags?.length"
                :domains="article.domains"
                :tags="article.tags"
              />
              <h2>
                <AppLink :href="`/article/${article.id}`" class="ft-a-title">{{
                  article.title || "未命名文章"
                }}</AppLink>
              </h2>
            </div>
            <div class="article-list__stats ft-fade">
              <AppLink :href="`/article/${article.id}#comments`" class="ft-fade"
                >{{ formatCount(article.replyCount) }} 条回复</AppLink
              >
              <span> · </span>
              <AppLink :href="`/article/${article.id}`" class="ft-fade"
                >{{ formatCount(article.viewCount) }} 次浏览</AppLink
              >
            </div>
          </div>
          <div class="article-list__body">
            <div class="article-list__details">
              <div class="article-list__author-row">
                <AppLink
                  :href="article.authorUser?.name ? `/member/${article.authorUser.name}` : '/'"
                  class="article-list__author"
                >
                  <Avatar :name="article.authorUser?.name" :size="40" :url="article.authorUser?.avatarUrl" square />
                </AppLink>
                <div class="article-list__author-line ft-smaller ft-fade">
                  <p>
                    <AppLink
                      :href="article.authorUser?.name ? `/member/${article.authorUser.name}` : '/'"
                      class="author"
                      >{{ article.authorUser?.nickname || article.authorUser?.name || "匿名用户" }}</AppLink
                    >
                    <span v-if="article.authorUser?.introduction"> - {{ article.authorUser.introduction }}</span>
                  </p>
                  <p v-if="article.lastReplyUser">
                    {{ article.lastReplyUser.nickname || article.lastReplyUser.name || "匿名用户" }} 回复于
                    {{ article.lastReplyAt ? fromNow(article.lastReplyAt) : "刚刚" }}
                  </p>
                  <p v-else>{{ article.publishedAt ? `${fromNow(article.publishedAt)} 发布` : "刚刚发布" }}</p>
                </div>
              </div>
              <AppLink v-if="article.content" :href="`/article/${article.id}`" class="abstract">{{
                article.content
              }}</AppLink>
            </div>
            <AppLink
              v-if="article.coverImageUrl"
              :href="`/article/${article.id}`"
              :style="{ backgroundImage: `url(${article.coverImageUrl})` }"
              aria-label="查看文章"
              class="abstract-img"
            ></AppLink>
          </div>
          <span
            :style="{ width: `${Math.min(100, Math.max(2, (article.replyCount || 0) * 3))}px` }"
            aria-hidden="true"
            class="heat"
          ></span>
        </template>
      </li>
    </ul>
  </div>
</template>
