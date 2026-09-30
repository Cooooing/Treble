<script lang="ts" setup>
import { onMounted } from "vue";
import { useData } from "vike-vue/useData";
import { message } from "@/components/feedback/message";
import type { Data } from "./+data";
import ArticleForm from "@/pages/article/ArticleForm.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";

const data = useData<Data>();

onMounted(() => {
  if (!data.article) message.error("草稿不存在或无权访问。");
});
</script>

<template>
  <ArticleForm v-if="data.article" :key="data.article.id" :article="data.article" />
  <ErrorState
    v-else
    :message="data.error || '草稿暂时无法访问。'"
    :title="data.pageStatus === 404 ? '草稿未找到' : '草稿暂时无法打开'"
  />
</template>
