<script lang="ts" setup>
import { ref } from "vue";
import type { Moonbreeze } from "@bass/bbs-sdk-fetch/models/Moonbreeze";
import MoonbreezeComposer from "@/components/moonbreeze/MoonbreezeComposer.vue";
import Avatar from "@/components/identity/Avatar.vue";
import AppLink from "@/components/ui/AppLink.vue";

const props = defineProps<{ rows: Moonbreeze[] }>();
const emit = defineEmits<{ created: [row: Moonbreeze] }>();

const recentRows = ref(props.rows.slice(0, 5));

function created(row: Moonbreeze) {
  recentRows.value.unshift(row);
  recentRows.value = recentRows.value.slice(0, 5);
  emit("created", row);
}
</script>

<template>
  <section aria-label="清风明月侧栏" class="module moonbreeze-sidebar">
    <header class="module-header moonbreeze-sidebar__composer">
      <MoonbreezeComposer @created="created" />
    </header>
    <div class="module-panel">
      <ul v-if="recentRows.length" class="moonbreeze-sidebar__rows">
        <li v-for="row in recentRows" :key="row.id">
          <AppLink :href="`/member/${row.author?.name}`" class="moonbreeze-sidebar__avatar">
            <Avatar :name="row.author?.name" size="100%" :url="row.author?.avatarUrl" square />
          </AppLink>
          <AppLink :href="`/member/${row.author?.name}/moonbreezes`" class="moonbreeze-sidebar__row">
            <span>{{ row.content }}</span>
          </AppLink>
        </li>
      </ul>
      <p v-else class="moonbreeze-sidebar__empty">暂无清风明月。</p>
    </div>
  </section>
</template>

<style scoped>
.moonbreeze-sidebar {
  overflow: hidden;
}

.moonbreeze-sidebar__composer {
  padding: 10px;
  border-bottom: 1px solid var(--layer-border-color);
}

.moonbreeze-sidebar__rows {
  list-style: none;
}

.moonbreeze-sidebar__rows li {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 10px;
  gap: 8px;
  border-bottom: 1px solid var(--layer-border-color);
}

.moonbreeze-sidebar__avatar {
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
}

.moonbreeze-sidebar__avatar :deep(.avatar) {
  display: block;
  width: 100%;
  height: 100%;
}

.moonbreeze-sidebar__row {
  display: block;
  min-width: 0;
  color: var(--text-color);
  font-size: 13px;
  line-height: 20px;
}

.moonbreeze-sidebar__row:hover,
.moonbreeze-sidebar__row:focus-visible {
  color: var(--link-color);
  text-decoration: none;
}

.moonbreeze-sidebar__row span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.moonbreeze-sidebar__row span,
.moonbreeze-sidebar__empty {
  color: var(--text-color);
  font-size: 13px;
}

.moonbreeze-sidebar__empty {
  margin: 0;
  padding: 14px 10px;
  color: var(--text-fade-color);
  line-height: 20px;
  text-align: center;
}
</style>
