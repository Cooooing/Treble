<script lang="ts" setup>
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
  <ErrorState v-if="error" :message="error" title="标签暂时无法打开" />
  <div v-else class="main">
    <div class="wrapper">
      <section class="content">
        <ContentPanel title="标签">
          <div v-if="rows.length" class="taxonomy-list list">
            <ul>
              <li v-for="tag in rows" :key="tag.id || tag.name" class="taxonomy-list__item">
                <span
                  :style="
                    tag.icon
                      ? { backgroundImage: `url(${tag.icon.startsWith('/v1/') ? `/api/bbs${tag.icon}` : tag.icon})` }
                      : undefined
                  "
                  aria-hidden="true"
                  class="avatar taxonomy-list__icon"
                ></span>
                <div class="fn-flex-1">
                  <h3>
                    <AppLink :href="`/tag/${encodeURIComponent(tag.name || '')}`" class="ft-a-title">{{
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
      <ContentSidebar :domains="domains" :tags="rows" />
    </div>
  </div>
</template>
