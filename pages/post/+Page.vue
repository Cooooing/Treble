<script setup lang="ts">
import type { ReqArticleTypeEnum } from "@bass/bbs-sdk-fetch/models/ReqArticle";
import { usePageContext } from "vike-vue/usePageContext";
import ArticleForm from "@/pages/article/ArticleForm.vue";
import { articleTypes } from "@/pages/article";

const requestedType = new URLSearchParams(usePageContext().urlOriginal.split("?")[1] || "").get("type");
const type = articleTypes.find((item) => item.type === requestedType)?.type as ReqArticleTypeEnum | undefined;
</script>

<template><ArticleForm :type="type || 'ARTICLE_TYPE_NORMAL'" /></template>
