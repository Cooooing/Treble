<script setup lang="ts">
import type { ArticleListItem } from "@bass/bbs-sdk-fetch/models/ArticleListItem";
import Avatar from "@/components/Avatar";
import { fromNow } from "@/utils/date";
import ArticleTaxonomy from "./ArticleTaxonomy.vue";

defineProps<{ articles: ArticleListItem[]; compact?: boolean }>();

function formatCount(value: number | undefined): string {
  const count = Math.max(0, Math.trunc(value ?? 0));

  for (const [threshold, suffix] of [[1_000_000_000, "b"], [1_000_000, "m"], [1_000, "k"]] as const) {
    if (count < threshold) continue;

    const compact = Math.floor((count * 10) / threshold) / 10;
    return `${Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(1)}${suffix}`;
  }

  return String(count);
}
</script>

<template>
  <div class="article-list list" :class="{ 'article-list--compact': compact }">
    <ul>
      <li v-for="article in articles" :key="article.id">
        <template v-if="compact">
          <div class="article-list__compact-row">
            <a :href="`/article/${article.id}`" :aria-label="`${article.authorUser?.nickname || article.authorUser?.name || '用户'}的头像`">
              <Avatar
                class="avatar-small slogan"
                :url="article.authorUser?.avatarUrl"
                :name="article.authorUser?.name"
                :size="32"
              />
            </a>
            <div class="article-list__compact-details fn-flex-1">
              <a class="title fn-ellipsis" :href="`/article/${article.id}`">{{ article.title || "未命名文章" }}</a>
            </div>
            <a class="article-list__reply-link" :href="`/article/${article.id}#comments`" :aria-label="`${article.replyCount || 0} 条回复`">
              <span class="count ft-gray ft-smaller">{{ formatCount(article.replyCount) }}</span>
            </a>
          </div>
        </template>
        <template v-else>
          <div class="article-list__info ft-smaller">
            <div class="article-list__taxonomy">
              <ArticleTaxonomy :domains="article.domains" :tags="article.tags" inline />
            </div>
            <div class="article-list__stats ft-fade">
              <a class="ft-fade" :href="`/article/${article.id}#comments`">{{ formatCount(article.replyCount) }} 条回复</a>
              <span> · </span>
              <a class="ft-fade" :href="`/article/${article.id}`">{{ formatCount(article.viewCount) }} 次浏览</a>
            </div>
          </div>
          <h2>
            <a class="ft-a-title" :href="`/article/${article.id}`">{{ article.title || "未命名文章" }}</a>
          </h2>
          <div class="article-list__body">
            <div class="article-list__details">
              <div class="article-list__author-row">
                <a :href="article.authorUser?.url" class="article-list__author">
                  <Avatar :url="article.authorUser?.avatarUrl" :name="article.authorUser?.name" :size="28" square />
                </a>
                <p class="article-list__author-line ft-smaller ft-fade">
                  <a :href="article.authorUser?.url" class="author">{{ article.authorUser?.nickname || article.authorUser?.name || "匿名用户" }}</a>
                  <span v-if="article.authorUser?.introduction"> · {{ article.authorUser.introduction }}</span>
                  <br />
                  <span v-if="article.lastReplyUser">{{ article.lastReplyUser.nickname || article.lastReplyUser.name || "匿名用户" }} 回复于 {{ article.lastReplyAt ? fromNow(article.lastReplyAt) : "刚刚" }}</span>
                  <span v-else>{{ article.publishedAt ? `${fromNow(article.publishedAt)} 发布` : "刚刚发布" }}</span>
                </p>
              </div>
              <a v-if="article.content" class="abstract" :href="`/article/${article.id}`">{{ article.content }}</a>
            </div>
            <a v-if="article.coverImageUrl" class="abstract-img" :href="`/article/${article.id}`" :style="{ backgroundImage: `url(${article.coverImageUrl})` }" aria-label="查看文章"></a>
          </div>
          <span class="heat" :style="{ width: `${Math.min(100, Math.max(2, (article.replyCount || 0) * 3))}px` }" aria-hidden="true"></span>
        </template>
      </li>
    </ul>
  </div>
</template>
