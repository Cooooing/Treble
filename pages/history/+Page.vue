<script lang="ts" setup>
import { computed, toRefs } from "vue";
import { useData } from "vike-vue/useData";
import type { ArticleViewHistoryItem } from "@bass/bbs-sdk-fetch/models/ArticleViewHistoryItem";
import type { ArticleListItem } from "@bass/bbs-sdk-fetch/models/ArticleListItem";
import ArticleList from "@/components/article/ArticleList.vue";
import EmptyState from "@/components/feedback/EmptyState.vue";
import ContentPanel from "@/components/layout/ContentPanel.vue";
import AppLink from "@/components/ui/AppLink.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";
import { pageNumber } from "@/utils/page";
import type { Data } from "./+data";

const { rows, page, error } = toRefs(useData<Data>());
const historyRows = computed(() => (rows.value || []) as ArticleViewHistoryItem[]);
const articles = computed(() =>
  historyRows.value.flatMap((row) => (row.article ? [row.article as ArticleListItem] : [])),
);
const currentPage = computed(() => pageNumber(page.value?.page));
const totalPages = computed(() =>
  Math.max(1, Math.ceil(pageNumber(page.value?.total, 0) / pageNumber(page.value?.size, 20))),
);
</script>

<template>
  <ErrorState v-if="error" :message="error" title="浏览历史暂时无法打开" />
  <main v-else class="main view-history-page">
    <div class="wrapper">
      <section class="content view-history-panel">
        <ContentPanel title="浏览历史">
          <ArticleList v-if="articles.length" :articles="articles" />
          <EmptyState v-else />
          <nav v-if="totalPages > 1" aria-label="浏览历史分页" class="view-history-pager">
            <AppLink v-if="currentPage > 1" :href="`/history?page=${currentPage - 1}`">上一页</AppLink>
            <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
            <AppLink v-if="currentPage < totalPages" :href="`/history?page=${currentPage + 1}`">下一页</AppLink>
          </nav>
        </ContentPanel>
      </section>
    </div>
  </main>
</template>

<style scoped>
.view-history-page {
  padding: 20px 0;
}

.view-history-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 14px;
  border-top: 1px solid var(--layer-border-color);
  color: var(--text-fade-color);
  font-size: 13px;
}

.view-history-pager a {
  color: var(--link-color);
  text-decoration: none;
}

@media (max-width: 768px) {
  .view-history-page {
    padding: 8px 0;
  }
}
</style>
