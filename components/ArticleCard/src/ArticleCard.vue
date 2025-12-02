<script setup lang="ts">
  import { IArticle } from '@/apis/article';
  import Item from './Item.vue';

  withDefaults(defineProps<{
    title: string;
    articles: IArticle[];
    mode?: 'item' | 'panel';
    more?: string;
  }>(), {
    mode: 'item',
  })
</script>

<template>
  <section class="card bg-base-100 shadow-md p-2">
    <header class="card-header flex justify-between items-center py-2 border-b border-base-content/20">
      <div class="card-title text-sm px-2">{{ title }}</div>
      <div v-if="more">
        <a :href="more" class="link link-hover text-xs px-2">更多</a>
      </div>
    </header>
    <section class="card-body p-0">
      <Item v-for="article in articles" :key="article.id" :article="article" />
    </section>
  </section>
</template>