<script lang="ts" setup>
import { useData } from "vike-vue/useData";
import { toRefs } from "vue";
import ArticleListPanel from "@/components/article/ArticleListPanel.vue";
import ContentSidebar from "@/components/layout/ContentSidebar.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";
import { Data } from "./+data";

const { rows, tags, domains, error } = toRefs(useData<Data>());
</script>
<template>
  <ErrorState v-if="error" :message="error" title="最新文章暂时无法打开" />
  <div v-else class="main">
    <div class="wrapper">
      <section class="content"><ArticleListPanel :articles="rows" title="最新" /></section>
      <ContentSidebar :domains="domains" :tags="tags" />
    </div>
  </div>
</template>
