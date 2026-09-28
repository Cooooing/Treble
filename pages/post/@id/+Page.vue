<script setup lang="ts">
import { onMounted } from "vue";
import { useData } from "vike-vue/useData";
import { message } from "@/components/Message";
import type { Data } from "./+data";
import ArticleForm from "@/pages/article/ArticleForm.vue";

const data = useData<Data>();

onMounted(() => {
  if (!data.article) message.error("草稿不存在或无权访问。");
});
</script>

<template>
  <ArticleForm v-if="data.article" :key="data.article.id" :article="data.article" />
  <div v-else class="main"><div class="wrapper"></div></div>
</template>
