<script lang="ts" setup>
import { computed, ref } from "vue";
import type { Moonbreeze } from "@bass/bbs-sdk-fetch/models/Moonbreeze";
import AppLink from "@/components/ui/AppLink.vue";
import Avatar from "@/components/identity/Avatar.vue";
import { message } from "@/components/feedback/message";
import { fromNow } from "@/utils/date";
import { bbsClient } from "@/utils/sdk";

type Stream = "public" | "watching" | "member";

const props = defineProps<{
  rows: Moonbreeze[];
  nextCursor?: string;
  stream: Stream;
  memberName?: string;
  emptyText?: string;
}>();
const emit = defineEmits<{ append: [rows: Moonbreeze[], nextCursor?: string] }>();
const cursor = ref(props.nextCursor);
const loading = ref(false);
const hasMore = computed(() => Boolean(cursor.value));

async function loadMore() {
  if (!cursor.value || loading.value) return;
  loading.value = true;
  try {
    const response =
      props.stream === "watching"
        ? await bbsClient.moonbreeze.pageWatching({ pageWatchingMoonbreezesReq: { cursor: cursor.value, size: 20 } })
        : props.stream === "member"
          ? await bbsClient.moonbreeze.pageMember({
              pageMemberMoonbreezesReq: { name: props.memberName || "", cursor: cursor.value, size: 20 },
            })
          : await bbsClient.moonbreeze.pagePublic({ pagePublicMoonbreezesReq: { cursor: cursor.value, size: 20 } });
    cursor.value = response.nextCursor;
    emit("append", response.rows || [], response.nextCursor);
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "加载失败，请稍后重试。", { id: "moonbreeze-page" });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section aria-label="清风明月动态" class="moonbreeze-list">
    <p v-if="!rows.length" class="moonbreeze-list__empty">{{ emptyText || "暂无清风明月。" }}</p>
    <article v-for="row in rows" :key="row.id" class="moonbreeze-card">
      <AppLink :href="`/member/${row.author?.name}`" class="moonbreeze-card__avatar">
        <Avatar :name="row.author?.name" size="100%" :url="row.author?.avatarUrl" square />
      </AppLink>
      <div class="moonbreeze-card__body">
        <header class="moonbreeze-card__meta">
          <AppLink :href="`/member/${row.author?.name}`">{{
            row.author?.nickname || row.author?.name || "匿名用户"
          }}</AppLink>
          <time v-if="row.createdAt" :datetime="row.createdAt.toISOString()">{{ fromNow(row.createdAt) }}</time>
          <span v-if="row.city" class="moonbreeze-card__city">{{ row.city }}</span>
        </header>
        <p class="moonbreeze-card__content">{{ row.content }}</p>
      </div>
    </article>
    <div v-if="hasMore" class="moonbreeze-list__more">
      <button :disabled="loading" type="button" @click="loadMore">{{ loading ? "加载中..." : "加载更多" }}</button>
    </div>
  </section>
</template>

<style scoped>
.moonbreeze-list {
  overflow: hidden;
  border: 1px solid var(--layer-border-color);
  border-radius: 8px;
  background: var(--layer-background-color);
  box-shadow: var(--shadow-card);
}
.moonbreeze-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  border-bottom: 1px solid var(--layer-border-color);
}
.moonbreeze-card:last-of-type {
  border-bottom: 0;
}
.moonbreeze-card__avatar {
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
}

.moonbreeze-card__avatar :deep(.avatar) {
  display: block;
  width: 100%;
  height: 100%;
}
.moonbreeze-card__body {
  min-width: 0;
  flex: 1;
}
.moonbreeze-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 5px 9px;
  min-height: 22px;
}
.moonbreeze-card__meta a {
  color: var(--text-color);
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
  text-decoration: none;
  overflow-wrap: anywhere;
}
.moonbreeze-card__meta a:hover,
.moonbreeze-card__meta a:focus-visible {
  color: var(--link-color);
  text-decoration: underline;
}
.moonbreeze-card__meta time,
.moonbreeze-card__city {
  color: var(--text-fade-color);
  font-size: 12px;
  line-height: 18px;
}
.moonbreeze-card__city::before {
  content: "·";
  margin-right: 9px;
}
.moonbreeze-card__content {
  margin: 5px 0 0;
  color: var(--text-color);
  font-size: 15px;
  line-height: 25px;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.moonbreeze-list__empty {
  margin: 0;
  padding: 48px 20px;
  color: var(--text-fade-color);
  font-size: 14px;
  line-height: 24px;
  text-align: center;
}
.moonbreeze-list__more {
  padding: 10px;
  border-top: 1px solid var(--layer-border-color);
  text-align: center;
}
.moonbreeze-list__more button {
  min-width: 112px;
  min-height: 40px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--link-color);
  cursor: pointer;
  font: inherit;
  font-size: 14px;
}
.moonbreeze-list__more button:hover,
.moonbreeze-list__more button:focus-visible {
  background: var(--color-accent-soft);
  outline: none;
}
.moonbreeze-list__more button:disabled {
  cursor: wait;
  opacity: 0.6;
}
@media (max-width: 480px) {
  .moonbreeze-card {
    gap: 10px;
    padding: 13px;
  }
}
</style>
