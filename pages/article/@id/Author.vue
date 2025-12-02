<script setup lang="ts">
  import { IArticle } from '@/apis/article';
  import { fromNow } from '@/utils/date';

  const props = defineProps<{
    article: IArticle
  }>();

</script>

<template>
  <section class="flex bg-base-200">
    <section>
      <Avatar :url="article.author_user.avatar_url" :size="60" square  />
    </section>
    <section class="flex justify-between items-center flex-1 text-sm text-base-content/70">
      <section class="inline-flex flex-col items-center px-3">
        <span>{{ article.author_user.name }}</span>
        <span>
          发表于 {{ fromNow(article.created_at.seconds * 1000) }}
        </span>
      </section>
      <section class="flex gap-4 px-4">
        <div class="inline-flex flex-col items-center">
          <span>{{ article.author_user.city || '未知' }}</span>
          <span class="text-xs">位置</span>
        </div>
        <div class="inline-flex flex-col items-center">
          <span>{{ article.like_count || 0 }}</span>
          <span class="text-xs">点赞</span>
        </div>
        <div class="inline-flex flex-col items-center">
          <span>{{ article.watch_count || 0 }}</span>
          <span class="text-xs">关注</span>
        </div>
        <div class="inline-flex flex-col items-center">
          <span>{{ article.collect_count || 0 }}</span>
          <span class="text-xs">收藏</span>
        </div>
      </section>
    </section>
  </section>
</template>