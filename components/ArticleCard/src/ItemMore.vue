<script setup lang="ts">
  import { IArticle } from '@/apis/article';
  import { formatDateTime } from '@/utils';

  defineProps<{
    article: IArticle
  }>()
</script>

<template>
  <section class="truncate space-y-1 p-2 border-b border-base-content/20">
    <section class="truncate text-base font-bold">
      <a class="text-inherit" :href="`/article/${article.id}`">
        {{ article.title }}
      </a>
    </section>
    <section class="text-xs space-x-1">
      <template v-if="article.tags?.length">
        <a v-for="tag in article.tags" :key="tag.id" :href="`/tag/${tag.name}`" class="badge badge-outline badge-xs badge-primary">
          {{ tag.name }}
        </a>
        <span>·</span>
      </template>
      <span>
        <span class="text-accent">{{ article.reply_count || 0 }}</span> 回帖
      </span>
      <span>·</span>
      <span>
        {{ formatDateTime(article.created_at.seconds * 1000) }}
      </span>
    </section>
  </section>
</template>

<style lang="less" scoped>
</style>