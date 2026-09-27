<script setup lang="ts">
import { onMounted } from "vue";
import { useData } from "vike-vue/useData";
import { message } from "@/components/Message";
import type { Data } from "./+data";
import ArticleForm from "@/pages/article/ArticleForm.vue";

const { article } = useData<Data>();

onMounted(() => {
  if (!article) message.error("草稿不存在或无权访问。");
});
</script>

<template>
  <ArticleForm v-if="article" :article="article" />
  <div v-else class="main"><div class="wrapper"></div></div>
</template>
