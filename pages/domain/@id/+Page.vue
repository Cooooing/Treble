<script setup lang="ts">
import { useData } from "vike-vue/useData";
import ArticleCard from "@/components/ArticleCard";
import ContentSidebar from "@/components/ContentSidebar.vue";
import type { Data } from "./+data";

const { domain, articles, domainTags, sidebarTags, domains } = useData<Data>();
</script>

<template>
  <div class="main">
    <div class="wrapper">
      <section class="content">
        <section class="module taxonomy-page__intro">
          <div class="module-panel">
            <div class="taxonomy-page__identity">
              <span
                v-if="domain.icon"
                class="avatar taxonomy-page__icon"
                :style="{ backgroundImage: `url(${domain.icon.startsWith('/v1/') ? `/api/bbs${domain.icon}` : domain.icon})` }"
                aria-hidden="true"
              ></span>
              <div>
                <h1><a :href="`/domain/${domain.code || domain.id}`">{{ domain.name }}</a></h1>
                <p class="ft-fade">{{ domain.description || "暂无领域描述。" }}</p>
              </div>
            </div>
            <nav v-if="domainTags.length" class="domain-tags" aria-label="领域标签">
              <a v-for="tag in domainTags" :key="tag.id || tag.name" rel="tag" :href="`/tag/${encodeURIComponent(tag.name || '')}`">{{ tag.name }}</a>
            </nav>
          </div>
        </section>
        <ArticleCard :articles="articles" title="领域文章" />
      </section>
      <ContentSidebar :tags="sidebarTags" :domains="domains" />
    </div>
  </div>
</template>
