<script setup lang="ts">
  import { IArticle } from '@/apis/article';

  defineProps<{
    article: IArticle
  }>()
</script>

<template>
  <section class="truncate flex items-center gap-2 py-1 px-2">
    <section>
      <MemberLink 
        :username="article.author_user.name" 
        :avatar="article.author_user.avatar_url" 
        :size="20" 
        square
        class="rounded overflow-hidden"
      />
    </section>
    <section class="truncate">
      <a :href="`/article/${article.id}`" class="hover:border-b border-dashed text-current">
        {{ article.title }}
      </a>
    </section>
  </section>
</template>

<style lang="less" scoped>
</style>