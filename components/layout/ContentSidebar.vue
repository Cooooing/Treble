<script setup lang="ts">
import type { RespDomain } from "@bass/bbs-sdk-fetch/models/RespDomain";
import type { RespTag } from "@bass/bbs-sdk-fetch/models/RespTag";
import ContentPanel from "@/components/layout/ContentPanel.vue";
import AppLink from "@/components/ui/AppLink.vue";

defineProps<{ tags?: RespTag[]; domains?: RespDomain[] }>();
</script>

<template>
  <aside class="side">
    <ContentPanel title="领域" more-href="/domains">
      <ul v-if="domains?.length" class="module-list community-sidebar__domains">
        <li v-for="domain in domains" :key="domain.id">
          <AppLink :href="`/domain/${domain.code || domain.id}`" class="community-sidebar__domain">
            <span
              class="community-sidebar__icon"
              :style="
                domain.icon
                  ? {
                      backgroundImage: `url(${domain.icon.startsWith('/v1/') ? `/api/bbs${domain.icon}` : domain.icon})`,
                    }
                  : undefined
              "
              aria-hidden="true"
            ></span>
            <span class="title">{{ domain.name }}</span>
          </AppLink>
        </li>
      </ul>
      <p v-else class="community-sidebar__empty">暂无领域</p>
    </ContentPanel>
    <ContentPanel title="标签" more-href="/tags">
      <nav v-if="tags?.length" class="community-sidebar__tags" aria-label="标签目录">
        <AppLink
          v-for="tag in tags"
          :key="tag.id || tag.name"
          rel="tag"
          :href="`/tag/${encodeURIComponent(tag.name || '')}`"
          :title="tag.description || tag.name"
          >{{ tag.name }}</AppLink
        >
      </nav>
      <p v-else class="community-sidebar__empty">暂无标签</p>
    </ContentPanel>
  </aside>
</template>
