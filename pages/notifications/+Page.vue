<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useData } from "vike-vue/useData";
import type { RespNotification } from "@bass/bbs-sdk-fetch/models/RespNotification";
import { message } from "@/components/Message";
import { fromNow } from "@/utils/date";
import { bbsClient } from "@/utils/sdk";
import EmptyState from "@/components/ui/EmptyState.vue";
import type { Data } from "./+data";

const { rows } = useData<Data>();
const notifications = ref<RespNotification[]>(rows || []);
const marking = ref(false);

onMounted(async () => {
  const unreadIds = notifications.value.flatMap((notification) =>
    notification.id && !notification.readAt ? [notification.id] : [],
  );
  if (!unreadIds.length) return;

  marking.value = true;
  try {
    await bbsClient.notification.markRead({ markReadNotificationReq: { ids: unreadIds } });
    notifications.value = notifications.value.map((notification) => ({
      ...notification,
      readAt: notification.readAt || new Date(),
    }));
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "通知状态更新失败，请稍后重试。");
  } finally {
    marking.value = false;
  }
});
</script>

<template>
  <div class="main notifications-page">
    <div class="wrapper">
      <section class="content module notifications-panel">
        <header class="module-header notifications-panel__header">
          <div>
            <h1>通知</h1>
            <p>与你有关的互动与系统消息</p>
          </div>
          <span v-if="marking" class="notifications-panel__status" role="status">正在标记已读...</span>
        </header>
        <ul v-if="notifications.length" class="notifications-list">
          <li
            v-for="notification in notifications"
            :key="notification.id"
            class="notifications-list__item"
            :class="{ 'notifications-list__item--read': notification.readAt }"
          >
            <span class="notifications-list__marker" aria-hidden="true" />
            <article>
              <div class="notifications-list__meta">
                <strong>{{ notification.title || "系统通知" }}</strong>
                <time v-if="notification.createdAt">{{ fromNow(notification.createdAt) }}</time>
              </div>
              <p>{{ notification.content || "暂无通知内容。" }}</p>
            </article>
          </li>
        </ul>
        <EmptyState v-else />
      </section>
    </div>
  </div>
</template>

<style scoped>
.notifications-page {
  padding: 20px 0;
}

.notifications-panel {
  overflow: hidden;
}

.notifications-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
}

.notifications-panel__header h1 {
  margin: 0;
  color: var(--text-color);
  font-size: 18px;
  line-height: 24px;
}

.notifications-panel__header p {
  margin: 3px 0 0;
  color: var(--text-fade-color);
  font-size: 12px;
  line-height: 18px;
}

.notifications-panel__status {
  flex: 0 0 auto;
  color: var(--text-fade-color);
  font-size: 12px;
}

.notifications-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.notifications-list__item {
  position: relative;
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr);
  gap: 12px;
  padding: 17px 20px;
  border-top: 1px solid var(--layer-border-color);
  background: var(--layer-background-color);
  transition: background-color 160ms ease;
}

.notifications-list__item:hover {
  background: var(--background-secondary-color);
}

.notifications-list__marker {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--link-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--link-color) 14%, transparent);
}

.notifications-list__item--read .notifications-list__marker {
  background: var(--layer-border-color);
  box-shadow: none;
}

.notifications-list__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.notifications-list__meta strong {
  min-width: 0;
  color: var(--text-color);
  font-size: 14px;
  line-height: 20px;
}

.notifications-list__meta time {
  flex: 0 0 auto;
  color: var(--text-fade-color);
  font-size: 12px;
  line-height: 18px;
}

.notifications-list__item p {
  margin: 5px 0 0;
  color: var(--text-gray-color);
  font-size: 13px;
  line-height: 20px;
  overflow-wrap: anywhere;
}

.notifications-list__item--read strong,
.notifications-list__item--read p {
  color: var(--text-fade-color);
  font-weight: 400;
}

:global(html[data-theme="dark"]) .notifications-list__item {
  border-color: #1f252b;
  background: #2f363d;
}

:global(html[data-theme="dark"]) .notifications-list__item--read {
  background: #24292e;
}

:global(html[data-theme="dark"]) .notifications-list__item:hover,
:global(html[data-theme="dark"]) .notifications-list__item--read:hover {
  background: #3a444d;
}

:global(html[data-theme="dark"]) .notifications-list__item--read .notifications-list__marker {
  background: #586069;
}

:global(html[data-theme="dark"]) .notifications-list__item--read strong,
:global(html[data-theme="dark"]) .notifications-list__item--read p,
:global(html[data-theme="dark"]) .notifications-list__meta time {
  color: #aeb8c2;
}

@media (max-width: 768px) {
  .notifications-page {
    padding: 10px 0;
  }

  .notifications-panel__header,
  .notifications-list__item {
    padding-right: 14px;
    padding-left: 14px;
  }

  .notifications-list__meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }
}
</style>
