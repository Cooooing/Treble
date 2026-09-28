<script setup lang="ts">
import { useData } from "vike-vue/useData";
import { toRefs } from "vue";
import Panel from "@/components/community/Panel.vue";
import ContentSidebar from "@/components/ContentSidebar.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import type { Data } from "./+data";

const { rows, domains } = toRefs(useData<Data>());
</script>

<template>
  <div class="main">
    <div class="wrapper">
      <section class="content">
        <Panel title="标签">
          <div v-if="rows.length" class="taxonomy-list list">
            <ul>
              <li v-for="tag in rows" :key="tag.id || tag.name" class="taxonomy-list__item">
                <span
                  class="avatar taxonomy-list__icon"
                  :style="tag.icon ? { backgroundImage: `url(${tag.icon.startsWith('/v1/') ? `/api/bbs${tag.icon}` : tag.icon})` } : undefined"
                  aria-hidden="true"
                ></span>
                <div class="fn-flex-1">
                  <h3>
                    <a class="ft-a-title" :href="`/tag/${encodeURIComponent(tag.name || '')}`">{{ tag.name }}</a>
                  </h3>
                  <div class="vditor-reset">{{ tag.description || "暂无标签描述。" }}</div>
                  <p class="taxonomy-list__meta ft-fade ft-smaller">{{ tag.articleCount || 0 }} 篇文章</p>
                </div>
              </li>
            </ul>
          </div>
          <EmptyState v-else />
        </Panel>
      </section>
      <ContentSidebar :tags="rows" :domains="domains" />
    </div>
  </div>
</template>
