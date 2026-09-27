<script setup lang="ts">
  import type { ArticleListItem } from '@bass/bbs-sdk-fetch/models/ArticleListItem';
  import ArticleList from '@/components/community/ArticleList.vue';
  import Panel from '@/components/community/Panel.vue';
  import EmptyState from '@/components/ui/EmptyState.vue';

  withDefaults(defineProps<{
    title?: string;
    articles: ArticleListItem[];
    compact?: boolean;
    more?: string;
  }>(), {
    compact: false,
  })
</script>

<template>
  <Panel :title="title" :more-href="more">
    <ArticleList v-if="articles.length" :articles="articles" :compact="compact" />
    <EmptyState v-else />
  </Panel>
</template>
