<script lang="ts" setup>
import type { ArticleListItem } from "@bass/bbs-sdk-fetch/models/ArticleListItem";
import { useData } from "vike-vue/useData";
import { computed, ref, toRefs, watch } from "vue";
import ArticleList from "@/components/article/ArticleList.vue";
import EmptyState from "@/components/feedback/EmptyState.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";
import ContentPanel from "@/components/layout/ContentPanel.vue";
import { message } from "@/components/feedback/message";
import { bbsClient } from "@/utils/sdk";
import { Data } from "./+data";

const initial = useData<Data>();
const { query, error } = toRefs(initial);
const rows = ref<ArticleListItem[]>([...(initial.rows || [])]);
const nextCursor = ref(initial.nextCursor);
const loading = ref(false);
const hasQuery = computed(() => Boolean(query.value));

watch(
  () => [initial.query, initial.rows, initial.nextCursor] as const,
  ([, nextRows, cursor]) => {
    rows.value = [...(nextRows || [])];
    nextCursor.value = cursor;
    loading.value = false;
  },
);

async function loadMore() {
  if (!nextCursor.value || loading.value) return;
  loading.value = true;
  try {
    const result = await bbsClient.articleSearch.search({
      searchArticlesReq: { query: query.value, cursor: nextCursor.value, size: 20 },
    });
    rows.value.push(...(result.rows || []));
    nextCursor.value = result.nextCursor;
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "加载更多搜索结果失败。");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <ErrorState v-if="error" :message="error" title="搜索暂时无法完成" />
  <main v-else class="main">
    <div class="wrapper search-page">
      <section class="content">
        <ContentPanel :title="hasQuery ? `“${query}” 的搜索结果` : '搜索文章'">
          <p v-if="!hasQuery" class="search-page__hint">输入至少两个字符即可搜索公开文章。</p>
          <EmptyState v-else-if="!rows.length" description="换一个更具体的关键词试试。" />
          <template v-else>
            <ArticleList :articles="rows" />
            <footer v-if="nextCursor" class="search-page__more">
              <button :disabled="loading" type="button" @click="loadMore">
                {{ loading ? "正在加载…" : "加载更多" }}
              </button>
            </footer>
          </template>
        </ContentPanel>
      </section>
    </div>
  </main>
</template>

<style scoped>
.search-page {
  max-width: 900px;
}
.search-page .content {
  width: 100%;
}
.search-page__hint {
  margin: 4px 0;
  color: var(--text-fade-color);
  font-size: 14px;
}
.search-page__more {
  display: flex;
  justify-content: center;
  padding: 18px 0 3px;
}
.search-page__more button {
  min-width: 116px;
  min-height: 36px;
  padding: 0 16px;
  border: 1px solid var(--layer-border-color);
  border-radius: 6px;
  background: var(--background-secondary-color);
  color: var(--link-color);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.search-page__more button:hover:not(:disabled),
.search-page__more button:focus-visible:not(:disabled) {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  outline: none;
}
.search-page__more button:disabled {
  cursor: wait;
  opacity: 0.7;
}
</style>
