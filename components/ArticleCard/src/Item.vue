<script setup lang="ts">
  import { IArticle } from '@/apis/article';

  defineProps<{
    article: IArticle
  }>()
</script>

<template>
  <section class="truncate flex items-center gap-2 py-1 px-2">
    <section>
      <Avatar :url="article.author_user.avatar_url" :size="20" square  />
    </section>
    <section class="truncate">
      <a :href="`/article/${article.id}`">
        {{ article.title }}
      </a>
    </section>
  </section>
</template>

<style lang="less" scoped>
a {
  color: inherit;
}
</style>