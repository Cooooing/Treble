<script setup lang="ts">
import { useData } from "vike-vue/useData";
import ArticleCard from "@/components/ArticleCard";
import ContentSidebar from "@/components/ContentSidebar.vue";
import { Data } from "./+data";

const { articles, tag, tags, domains } = useData<Data>();
</script>

<template>
  <div class="main" v-if="tag">
    <div class="wrapper">
      <section class="content">
        <header class="module-header">
          <h1>{{ tag.name }}</h1>
          <p class="ft-fade">{{ tag.description || "暂无描述" }}</p>
        </header>
        <ArticleCard :articles="articles" />
      </section>
      <ContentSidebar :tags="tags" :domains="domains" />
    </div>
  </div>
</template>
