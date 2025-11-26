<script setup lang="ts">
  import ArticleForm from "@/pages/article/ArticleForm.vue";
  import { useData } from "vike-vue/useData";
  import { Data } from "./+data";

  const { article } = useData<Data>();
</script>
<template>
  <ArticleForm :type="Number(article.type)" :article="article" />
</template>
