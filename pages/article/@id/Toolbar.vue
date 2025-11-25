<script setup lang="ts">
  import { IArticle } from '@/apis/article';

  const props = defineProps<{
    article: IArticle;
  }>()

</script>
<template>
  <section class="space-x-3 inline-flex items-center text-base-content/50">
    <span class="space-x-1 inline-flex items-center cursor-pointer hover:text-primary">
      <Icon icon="uiw:caret-left" />
    </span>
    <span class="space-x-1 inline-flex items-center cursor-pointer hover:text-primary">
      <Icon icon="uiw:caret-right" />
    </span>
    <span class="space-x-1 inline-flex items-center cursor-pointer hover:text-primary">
      <Icon icon="streamline-plump:like-1" />
      <span>{{ article.likeCount || 0 }}</span>
    </span>
    <span class="space-x-1 inline-flex items-center cursor-pointer hover:text-primary">
      <Icon icon="tabler:star" />
      <span>{{ article.collectCount || 0 }}</span>
    </span>
  </section>
</template>