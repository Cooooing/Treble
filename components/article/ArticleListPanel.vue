<script setup lang="ts">
import type { ArticleListItem } from "@bass/bbs-sdk-fetch/models/ArticleListItem";
import ArticleList from "@/components/article/ArticleList.vue";
import ContentPanel from "@/components/layout/ContentPanel.vue";
import EmptyState from "@/components/feedback/EmptyState.vue";

withDefaults(
  defineProps<{
    title?: string;
    articles: ArticleListItem[];
    compact?: boolean;
    more?: string;
  }>(),
  {
    compact: false,
  },
);
</script>

<template>
  <ContentPanel :title="title" :more-href="more">
    <ArticleList v-if="articles.length" :articles="articles" :compact="compact" />
    <EmptyState v-else />
  </ContentPanel>
</template>
