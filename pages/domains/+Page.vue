<script setup lang="ts">
import { useData } from "vike-vue/useData";
import { toRefs } from "vue";
import ContentSidebar from "@/components/layout/ContentSidebar.vue";
import ContentPanel from "@/components/layout/ContentPanel.vue";
import EmptyState from "@/components/feedback/EmptyState.vue";
import AppLink from "@/components/ui/AppLink.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";
import type { Data } from "./+data";
import "vditor/dist/index.css";

const { rows, tags, error } = toRefs(useData<Data>());
</script>

<template>
  <ErrorState v-if="error" title="领域暂时无法打开" :message="error" />
  <div v-else class="main">
    <div class="wrapper">
      <section class="content">
        <ContentPanel title="领域">
          <div v-if="rows.length" class="taxonomy-list list">
            <ul>
              <li v-for="domain in rows" :key="domain.id" class="taxonomy-list__item">
                <AppLink :href="`/domain/${domain.code || domain.id}`" class="taxonomy-list__icon-link">
                  <span
                    class="avatar taxonomy-list__icon"
                    :style="
                      domain.icon
                        ? {
                            backgroundImage: `url(${domain.icon.startsWith('/v1/') ? `/api/bbs${domain.icon}` : domain.icon})`,
                          }
                        : undefined
                    "
                    :aria-label="`${domain.name || '领域'}图标`"
                  ></span>
                </AppLink>
                <div class="fn-flex-1">
                  <h3>
                    <AppLink class="ft-a-title" :href="`/domain/${domain.code || domain.id}`">{{
                      domain.name
                    }}</AppLink>
                  </h3>
                  <div class="vditor-reset">{{ domain.description || "暂无领域描述。" }}</div>
                  <p class="taxonomy-list__meta ft-fade ft-smaller">{{ domain.code || "社区领域" }}</p>
                </div>
              </li>
            </ul>
          </div>
          <EmptyState v-else />
        </ContentPanel>
      </section>
      <ContentSidebar :tags="tags" :domains="rows" />
    </div>
  </div>
</template>
