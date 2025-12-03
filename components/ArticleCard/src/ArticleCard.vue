<script setup lang="ts">
  import { IArticle } from '@/apis/article';
  import Item from './Item.vue';
  import Panel from './Panel.vue';
import ItemMore from './ItemMore.vue';

  withDefaults(defineProps<{
    title?: string;
    articles: IArticle[];
    mode?: 'list' | 'panel' | 'list-more';
    more?: string;
  }>(), {
    mode: 'list',
  })
</script>

<template>
  <section class="card bg-base-100 shadow-md p-4">
    <header v-if="title" class="card-header flex justify-between items-center py-2 border-b border-base-content/20">
      <div class="card-title text-sm px-2">{{ title }}</div>
      <div v-if="more">
        <a :href="more" class="link link-hover text-xs px-2 text-info">更多</a>
      </div>
    </header>
    <section class="card-body p-0" v-if="mode == 'list'">
      <Item v-for="article in articles" :key="article.id" :article="article" />
    </section>
    <section class="card-body p-0" v-if="mode == 'list-more'">
      <ItemMore v-for="article in articles" :key="article.id" :article="article" />
    </section>
    <section class="card-body p-0" v-if="mode == 'panel'">
      <Panel v-for="article in articles" :key="article.id" :article="article" />
    </section>
  </section>
</template>
