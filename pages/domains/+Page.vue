<script setup lang="ts">
import { useData } from "vike-vue/useData";
import ContentSidebar from "@/components/ContentSidebar.vue";
import Panel from "@/components/community/Panel.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import type { Data } from "./+data";

const { rows, tags } = useData<Data>();
</script>

<template>
  <div class="main">
    <div class="wrapper">
      <section class="content">
        <Panel title="领域">
          <div v-if="rows.length" class="taxonomy-list list">
            <ul>
              <li v-for="domain in rows" :key="domain.id" class="taxonomy-list__item">
                <a :href="`/domain/${domain.code || domain.id}`" class="taxonomy-list__icon-link">
              <span
                    class="avatar taxonomy-list__icon"
                :style="domain.icon ? { backgroundImage: `url(${domain.icon.startsWith('/v1/') ? `/api/bbs${domain.icon}` : domain.icon})` } : undefined"
                :aria-label="`${domain.name || '领域'}图标`"
              ></span>
                </a>
                <div class="fn-flex-1">
                  <h3><a class="ft-a-title" :href="`/domain/${domain.code || domain.id}`">{{ domain.name }}</a></h3>
                  <div class="vditor-reset">{{ domain.description || "暂无领域描述。" }}</div>
                  <p class="taxonomy-list__meta ft-fade ft-smaller">{{ domain.code || "社区领域" }}</p>
                </div>
              </li>
            </ul>
          </div>
          <EmptyState v-else />
        </Panel>
      </section>
      <ContentSidebar :tags="tags" :domains="rows" />
    </div>
  </div>
</template>
