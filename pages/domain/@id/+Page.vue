<script setup lang="ts">
import { useData } from "vike-vue/useData";
import { toRefs } from "vue";
import ArticleListPanel from "@/components/article/ArticleListPanel.vue";
import ContentSidebar from "@/components/layout/ContentSidebar.vue";
import AppLink from "@/components/ui/AppLink.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";
import type { Data } from "./+data";

const { domain, articles, domainTags, sidebarTags, domains } = toRefs(useData<Data>());
</script>

<template>
  <ErrorState
    v-if="!domain"
    :title="pageStatus === 404 ? '领域未找到' : '领域暂时无法打开'"
    :message="error || '领域暂时无法访问。'"
  />
  <div v-else class="main">
    <div class="wrapper">
      <section class="content">
        <section class="module taxonomy-page__intro">
          <div class="module-panel">
            <div class="taxonomy-page__identity">
              <span
                v-if="domain.icon"
                class="avatar taxonomy-page__icon"
                :style="{
                  backgroundImage: `url(${domain.icon.startsWith('/v1/') ? `/api/bbs${domain.icon}` : domain.icon})`,
                }"
                aria-hidden="true"
              ></span>
              <div>
                <h1>
                  <AppLink :href="`/domain/${domain.code || domain.id}`">{{ domain.name }}</AppLink>
                </h1>
                <p class="ft-fade">{{ domain.description || "暂无领域描述。" }}</p>
              </div>
            </div>
            <nav v-if="domainTags.length" class="domain-tags" aria-label="领域标签">
              <AppLink
                v-for="tag in domainTags"
                :key="tag.id || tag.name"
                rel="tag"
                :href="`/tag/${encodeURIComponent(tag.name || '')}`"
                >{{ tag.name }}</AppLink
              >
            </nav>
          </div>
        </section>
        <ArticleListPanel :articles="articles" title="领域文章" />
      </section>
      <ContentSidebar :tags="sidebarTags" :domains="domains" />
    </div>
  </div>
</template>
