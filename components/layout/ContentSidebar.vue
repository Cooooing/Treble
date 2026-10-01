<script lang="ts" setup>
import type { RespDomain } from "@bass/bbs-sdk-fetch/models/RespDomain";
import type { RespTag } from "@bass/bbs-sdk-fetch/models/RespTag";
import ContentPanel from "@/components/layout/ContentPanel.vue";
import AppLink from "@/components/ui/AppLink.vue";

defineProps<{ tags?: RespTag[]; domains?: RespDomain[] }>();
</script>

<template>
  <aside class="side">
    <slot name="before" />
    <ContentPanel more-href="/domains" title="领域">
      <ul v-if="domains?.length" class="module-list community-sidebar__domains">
        <li v-for="domain in domains" :key="domain.id">
          <AppLink :href="`/domain/${domain.code || domain.id}`" class="community-sidebar__domain">
            <span
              :style="
                domain.icon
                  ? {
                      backgroundImage: `url(${domain.icon.startsWith('/v1/') ? `/api/bbs${domain.icon}` : domain.icon})`,
                    }
                  : undefined
              "
              aria-hidden="true"
              class="community-sidebar__icon"
            ></span>
            <span class="title">{{ domain.name }}</span>
          </AppLink>
        </li>
      </ul>
      <p v-else class="community-sidebar__empty">暂无领域</p>
    </ContentPanel>
    <ContentPanel more-href="/tags" title="标签">
      <nav v-if="tags?.length" aria-label="标签目录" class="community-sidebar__tags">
        <AppLink
          v-for="tag in tags"
          :key="tag.id || tag.name"
          :href="`/tag/${encodeURIComponent(tag.name || '')}`"
          :title="tag.description || tag.name"
          rel="tag"
          >{{ tag.name }}</AppLink
        >
      </nav>
      <p v-else class="community-sidebar__empty">暂无标签</p>
    </ContentPanel>
  </aside>
</template>
