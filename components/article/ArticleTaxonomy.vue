<script setup lang="ts">
import type { ArticleDomain } from "@bass/bbs-sdk-fetch/models/ArticleDomain";
import type { ArticleTag } from "@bass/bbs-sdk-fetch/models/ArticleTag";
import AppLink from "@/components/ui/AppLink.vue";

withDefaults(
  defineProps<{
    domains?: ArticleDomain[];
    tags?: ArticleTag[];
    compact?: boolean;
    inline?: boolean;
  }>(),
  {
    domains: () => [],
    tags: () => [],
    compact: false,
    inline: false,
  },
);
</script>

<template>
  <nav
    v-if="domains.length || tags.length"
    class="article-taxonomy"
    :class="{ 'article-taxonomy--compact': compact, 'article-taxonomy--inline': inline }"
    aria-label="文章分类"
  >
    <AppLink
      v-for="domain in domains"
      :key="domain.id"
      class="article-taxonomy__domain"
      :href="`/domain/${domain.code || domain.id}`"
    >
      {{ domain.name }}
    </AppLink>
    <AppLink
      v-for="tag in tags"
      :key="tag.id"
      rel="tag"
      class="article-taxonomy__tag"
      :href="`/tag/${encodeURIComponent(tag.name || tag.code || String(tag.id))}`"
    >
      {{ tag.name }}
    </AppLink>
  </nav>
</template>

<style scoped>
.article-taxonomy {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 20px;
}

.article-taxonomy a {
  display: inline-block;
  margin-right: 8px;
  padding: 0 3px;
  color: #4285f4;
  text-decoration: none;
}

.article-taxonomy a:hover,
.article-taxonomy a:focus-visible {
  color: #e59230;
  text-decoration: none;
  outline: 0;
}

.article-taxonomy--compact {
  margin: 2px 0 0;
}

.article-taxonomy--inline {
  margin: 0;
}

.article-taxonomy--inline {
  flex: 1 1 auto;
  flex-wrap: nowrap;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.article-taxonomy--inline a:first-child {
  padding-left: 0;
}

.article-taxonomy--compact a {
  font-size: 11px;
  line-height: 16px;
}

:global(html[data-theme="dark"]) .article-taxonomy a {
  color: #79b8ff;
}

:global(html[data-theme="dark"]) .article-taxonomy a:hover,
:global(html[data-theme="dark"]) .article-taxonomy a:focus-visible {
  color: #79b8ff;
}
</style>
