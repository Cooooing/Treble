<script setup lang="ts">
  import { useData } from "vike-vue/useData";
  import { Data } from "./+data";

  const prefixCls = useDesign('tag');
  const { articles, tag } = useData<Data>();
</script>

<template>
  <article :class="prefixCls" class="wrapper flex py-4" v-if="tag">
    <section class="space-y-4 flex-1">
      <header class="card bg-base-100 shadow-md p-4">
        <h1 class="text-xl font-bold">{{ tag.name }}</h1>
        <p class="text-base-content/70 text-xs">{{ tag.description || "暂无描述" }}</p>
      </header>
      <ArticleCard 
        v-if="articles.rows.length"
        :articles="articles.rows" 
        mode="panel"
      />
    </section>
    <aside class="w-100 flex-none"></aside>
  </article>
  <article v-else class="wrapper flex py-4">
    <section class="space-y-4 flex-1">
      <header class="card bg-base-100 shadow-md p-4">
        <h1 class="text-xl font-bold">标签不存在</h1>
      </header>
    </section>
    <aside class="w-100 flex-none"></aside>
  </article>
</template>