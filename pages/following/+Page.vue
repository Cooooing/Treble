<script lang="ts" setup>
import { toRefs } from "vue";
import { useData } from "vike-vue/useData";
import ArticleListPanel from "@/components/article/ArticleListPanel.vue";
import ViewHistorySidebar from "@/components/history/ViewHistorySidebar.vue";
import MoonbreezeSidebar from "@/components/moonbreeze/MoonbreezeSidebar.vue";
import ContentSidebar from "@/components/layout/ContentSidebar.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";
import { Data } from "./+data";

const { rows, tags, domains, moonbreezes, viewHistory, error } = toRefs(useData<Data>());
</script>

<template>
  <ErrorState v-if="error" :message="error" title="关注文章暂时无法打开" />
  <main v-else class="main">
    <div class="wrapper">
      <section class="content">
        <ArticleListPanel :articles="rows" empty-text="关注作者发布文章后会显示在这里。" title="关注" />
      </section>
      <ContentSidebar :domains="domains" :tags="tags">
        <template #before>
          <ViewHistorySidebar :rows="viewHistory" />
          <MoonbreezeSidebar :rows="moonbreezes" />
        </template>
      </ContentSidebar>
    </div>
  </main>
</template>
