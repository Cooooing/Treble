<script lang="ts" setup>
import { useData } from "vike-vue/useData";
import { toRefs } from "vue";
import ArticleListPanel from "@/components/article/ArticleListPanel.vue";
import MoonbreezeSidebar from "@/components/moonbreeze/MoonbreezeSidebar.vue";
import ContentSidebar from "@/components/layout/ContentSidebar.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";
import { Data } from "./+data";

const { rows, tags, domains, moonbreezes, error } = toRefs(useData<Data>());
</script>
<template>
  <ErrorState v-if="error" :message="error" title="热门文章暂时无法打开" />
  <div v-else class="main">
    <div class="wrapper">
      <section class="content"><ArticleListPanel :articles="rows" title="最热" /></section>
      <ContentSidebar :domains="domains" :tags="tags">
        <template #before><MoonbreezeSidebar :rows="moonbreezes" /></template>
      </ContentSidebar>
    </div>
  </div>
</template>
