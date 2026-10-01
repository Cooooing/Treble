<script lang="ts" setup>
import { ref } from "vue";
import type { Breezemoon } from "@bass/bbs-sdk-fetch/models/Breezemoon";
import BreezemoonComposer from "@/components/breezemoon/BreezemoonComposer.vue";
import Avatar from "@/components/identity/Avatar.vue";
import AppLink from "@/components/ui/AppLink.vue";

const props = defineProps<{ rows: Breezemoon[] }>();
const emit = defineEmits<{ created: [row: Breezemoon] }>();

const recentRows = ref(props.rows.slice(0, 5));

function created(row: Breezemoon) {
  recentRows.value.unshift(row);
  recentRows.value = recentRows.value.slice(0, 5);
  emit("created", row);
}
</script>

<template>
  <section aria-label="明月清风侧栏" class="module breezemoon-sidebar">
    <header class="module-header breezemoon-sidebar__composer">
      <BreezemoonComposer @created="created" />
    </header>
    <div class="module-panel">
      <ul v-if="recentRows.length" class="breezemoon-sidebar__rows">
        <li v-for="row in recentRows" :key="row.id">
          <AppLink :href="`/member/${row.author?.name}`" class="breezemoon-sidebar__avatar">
            <Avatar :name="row.author?.name" size="100%" :url="row.author?.avatarUrl" square />
          </AppLink>
          <AppLink :href="`/member/${row.author?.name}/breezemoons`" class="breezemoon-sidebar__row">
            <span>{{ row.content }}</span>
          </AppLink>
        </li>
      </ul>
      <p v-else class="breezemoon-sidebar__empty">暂无明月清风。</p>
    </div>
  </section>
</template>

<style scoped>
.breezemoon-sidebar {
  overflow: hidden;
}

.breezemoon-sidebar__composer {
  padding: 10px;
  border-bottom: 1px solid var(--layer-border-color);
}

.breezemoon-sidebar__rows {
  list-style: none;
}

.breezemoon-sidebar__rows li {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 10px;
  gap: 8px;
  border-bottom: 1px solid var(--layer-border-color);
}

.breezemoon-sidebar__avatar {
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
}

.breezemoon-sidebar__avatar :deep(.avatar) {
  display: block;
  width: 100%;
  height: 100%;
}

.breezemoon-sidebar__row {
  display: block;
  min-width: 0;
  color: var(--text-color);
  font-size: 13px;
  line-height: 20px;
}

.breezemoon-sidebar__row:hover,
.breezemoon-sidebar__row:focus-visible {
  color: var(--link-color);
  text-decoration: none;
}

.breezemoon-sidebar__row span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breezemoon-sidebar__row span,
.breezemoon-sidebar__empty {
  color: var(--text-color);
  font-size: 13px;
}

.breezemoon-sidebar__empty {
  margin: 0;
  padding: 14px 10px;
  color: var(--text-fade-color);
  line-height: 20px;
  text-align: center;
}
</style>
