<script setup lang="ts">
import { useData } from "vike-vue/useData";
import { toRefs } from "vue";
import ContentPanel from "@/components/layout/ContentPanel.vue";
import ContentSidebar from "@/components/layout/ContentSidebar.vue";
import EmptyState from "@/components/feedback/EmptyState.vue";
import AppLink from "@/components/ui/AppLink.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";
import type { Data } from "./+data";
import "vditor/dist/index.css";

const { rows, domains, error } = toRefs(useData<Data>());
</script>

<template>
  <ErrorState v-if="error" title="标签暂时无法打开" :message="error" />
  <div v-else class="main">
    <div class="wrapper">
      <section class="content">
        <ContentPanel title="标签">
          <div v-if="rows.length" class="taxonomy-list list">
            <ul>
              <li v-for="tag in rows" :key="tag.id || tag.name" class="taxonomy-list__item">
                <span
                  class="avatar taxonomy-list__icon"
                  :style="
                    tag.icon
                      ? { backgroundImage: `url(${tag.icon.startsWith('/v1/') ? `/api/bbs${tag.icon}` : tag.icon})` }
                      : undefined
                  "
                  aria-hidden="true"
                ></span>
                <div class="fn-flex-1">
                  <h3>
                    <AppLink class="ft-a-title" :href="`/tag/${encodeURIComponent(tag.name || '')}`">{{
                      tag.name
                    }}</AppLink>
                  </h3>
                  <div class="vditor-reset">{{ tag.description || "暂无标签描述。" }}</div>
                  <p class="taxonomy-list__meta ft-fade ft-smaller">{{ tag.articleCount || 0 }} 篇文章</p>
                </div>
              </li>
            </ul>
          </div>
          <EmptyState v-else />
        </ContentPanel>
      </section>
      <ContentSidebar :tags="rows" :domains="domains" />
    </div>
  </div>
</template>
