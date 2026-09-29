<script setup lang="ts">
import type { ArticleListItem } from "@bass/bbs-sdk-fetch/models/ArticleListItem";
import AppLink from "@/components/ui/AppLink.vue";
import { fromNow } from "@/utils/date";
import ArticleTaxonomy from "@/components/article/ArticleTaxonomy.vue";

defineProps<{ articles: ArticleListItem[] }>();

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
  <div class="member-article-list list">
    <ul>
      <li v-for="article in articles" :key="article.id">
        <div class="member-article-list__head">
          <h2>
            <AppLink class="ft-a-title" :href="`/article/${article.id}`">{{ article.title || "未命名文章" }}</AppLink>
          </h2>
          <div class="member-article-list__stats ft-fade">
            <AppLink class="ft-fade" :href="`/article/${article.id}#comments`"
              >{{ formatCount(article.replyCount) }} 条回复</AppLink
            >
            <span> · </span>
            <AppLink class="ft-fade" :href="`/article/${article.id}`"
              >{{ formatCount(article.viewCount) }} 次浏览</AppLink
            >
          </div>
        </div>
        <div class="member-article-list__meta ft-smaller ft-fade">
          <ArticleTaxonomy
            v-if="article.domains?.length || article.tags?.length"
            :domains="article.domains"
            :tags="article.tags"
            inline
          />
          <span>{{ article.publishedAt ? fromNow(article.publishedAt) : "刚刚发布" }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>
