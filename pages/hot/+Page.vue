<script setup lang="ts">
import { useData } from "vike-vue/useData";
import { toRefs } from "vue";
import ArticleListPanel from "@/components/article/ArticleListPanel.vue";
import ContentSidebar from "@/components/layout/ContentSidebar.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";
import { Data } from "./+data";

const { rows, tags, domains, error } = toRefs(useData<Data>());
</script>
<template>
  <ErrorState v-if="error" title="热门文章暂时无法打开" :message="error" />
  <div v-else class="main">
    <div class="wrapper">
      <section class="content"><ArticleListPanel :articles="rows" title="最热" /></section>
      <ContentSidebar :tags="tags" :domains="domains" />
    </div>
  </div>
</template>
