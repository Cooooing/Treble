<script lang="ts" setup>
import type { ArticleViewHistoryItem } from "@bass/bbs-sdk-fetch/models/ArticleViewHistoryItem";
import Avatar from "@/components/identity/Avatar.vue";
import ContentPanel from "@/components/layout/ContentPanel.vue";
import AppLink from "@/components/ui/AppLink.vue";

defineProps<{ rows: ArticleViewHistoryItem[] }>();

function authorName(row: ArticleViewHistoryItem): string {
  return row.article?.authorUser?.nickname || row.article?.authorUser?.name || "用户";
}

function authorHref(row: ArticleViewHistoryItem): string {
  const name = row.article?.authorUser?.name;
  return name ? `/member/${name}` : "/";
}
</script>

<template>
  <ContentPanel more-href="/history" title="近期看过">
    <ul v-if="rows.length" class="view-history-sidebar__rows">
      <li v-for="row in rows" :key="row.article?.id">
        <AppLink :aria-label="`${authorName(row)}的头像`" :href="authorHref(row)" class="view-history-sidebar__avatar">
          <Avatar :name="row.article?.authorUser?.name" :size="36" :url="row.article?.authorUser?.avatarUrl" square />
        </AppLink>
        <AppLink
          :href="`/article/${row.article?.id}`"
          :title="row.article?.title || '未命名文章'"
          class="view-history-sidebar__title"
        >
          {{ row.article?.title || "未命名文章" }}
        </AppLink>
      </li>
    </ul>
    <p v-else class="view-history-sidebar__empty">暂无浏览记录</p>
  </ContentPanel>
</template>

<style scoped>
.view-history-sidebar__rows {
  margin: 0;
  padding: 0;
  list-style: none;
}

.view-history-sidebar__rows li + li {
  border-top: 1px solid var(--layer-border-color);
}

.view-history-sidebar__rows li {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
}

.view-history-sidebar__avatar {
  display: block;
  height: 36px;
}

.view-history-sidebar__avatar :deep(.avatar) {
  display: block;
}

.view-history-sidebar__title {
  display: -webkit-box;
  overflow: hidden;
  color: var(--text-color);
  font-size: 13px;
  font-weight: 400;
  line-height: 19px;
  text-decoration: none;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.view-history-sidebar__empty {
  color: var(--text-fade-color);
  font-size: 12px;
  line-height: 18px;
  margin: 0;
  padding: 14px 12px;
  text-align: center;
}

.view-history-sidebar__avatar:focus-visible,
.view-history-sidebar__title:focus-visible,
.view-history-sidebar__title:hover {
  text-decoration: underline;
}
</style>
