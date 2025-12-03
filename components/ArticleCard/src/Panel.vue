<script setup lang="ts">
  import { IArticle } from '@/apis/article';
  import { fromNow } from '@/utils';

  defineProps<{
    article: IArticle
  }>()

  function toPreview(content: string) {
    return content.replace(/!\[.*?\]\([^)]+(\)|$)/g, '[图片]').replace(/(?=[^!])\[.*?\]\([^)]+(\)|$)/g, '[链接]');
  }
</script>

<template>
  <article class="py-1 px-2 space-y-1 border-b border-base-content/20">
    <aside class="flex justify-between items-center text-xs">
      <span>
        <a v-for="tag in article.tags" :key="tag.id" :href="`/tag/${tag.name}`" class="badge badge-soft badge-sm badge-primary mr-1">
          {{ tag.name }}
        </a>
      </span>
      <span>
        <span class="text-accent">{{ article.reply_count || 0 }}</span> 回帖
      </span>
    </aside>
    <header>
      <a :href="`/article/${article.id}`" class="font-bold hover:underline text-current text-lg">
        {{ article.title }}
      </a>
    </header>
    <section class="flex">
      <section class="flex-1 space-y-2">
        <section class="flex items-center gap-2">
          <MemberLink 
            :username="article.author_user.name" 
            :avatar="article.author_user.avatar_url" 
            :size="30" 
            square
            class="rounded overflow-hidden"
          />
          <section class="text-xs">
            <div>
              <MemberLink :username="article.author_user.name" />
            </div>
            <span v-if="article.last_reply_user">
              <MemberLink :username="article.last_reply_user.name" />
              {{ fromNow(article.last_reply_at.seconds * 1000) }}回帖
            </span>
            <span v-else>
              发表于 {{ fromNow(article.created_at.seconds * 1000) }}
            </span>
          </section>
        </section>
        <section class="opacity-80">{{ toPreview(article.content) }}</section>
      </section>
      <section v-if="article.cover_image_url" class="inline-flex w-[180px] flex-none p-3">
        <img :src="article.cover_image_url + `?imageView2/1/w/180/h/135/format/jpg/interlace/1/q`" class="w-full h-auto rounded" />
      </section>
    </section>
  </article>
</template>