<script lang="ts" setup>
import type { ReqArticleTypeEnum } from "@bass/bbs-sdk-fetch/models/ReqArticle";
import { computed } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import ArticleForm from "@/pages/article/ArticleForm.vue";
import { articleTypes } from "@/pages/article";

const pageContext = usePageContext();
const type = computed(() => {
  const requestedType = new URL(pageContext.urlOriginal, "http://treble.local").searchParams.get("type");
  return articleTypes.find((item) => item.type === requestedType)?.type as ReqArticleTypeEnum | undefined;
});
</script>

<template><ArticleForm :key="pageContext.urlOriginal" :type="type || 'ARTICLE_TYPE_NORMAL'" /></template>
