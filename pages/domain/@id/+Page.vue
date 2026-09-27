<script setup lang="ts">
import { useData } from "vike-vue/useData";
import ArticleCard from "@/components/ArticleCard";
import ContentSidebar from "@/components/ContentSidebar.vue";
import type { Data } from "./+data";

const { domain, articles, tags, domains } = useData<Data>();
</script>

<template>
  <div class="main">
    <div class="wrapper">
      <section class="content">
        <header class="module-header domain-page-header">
          <span
            class="domain-page-header__icon"
            :style="domain.icon ? { backgroundImage: `url(${domain.icon.startsWith('/v1/') ? `/api/bbs${domain.icon}` : domain.icon})` } : undefined"
            aria-hidden="true"
          ></span>
          <div>
            <h1>{{ domain.name }}</h1>
            <p class="ft-fade">{{ domain.description || "暂无领域描述。" }}</p>
          </div>
        </header>
        <section v-if="tags.length" class="domain-tags" aria-label="领域标签">
          <a v-for="tag in tags" :key="tag.id || tag.name" :href="`/tag/${encodeURIComponent(tag.name || '')}`">{{ tag.name }}</a>
        </section>
        <ArticleCard :articles="articles" title="领域文章" />
      </section>
      <ContentSidebar :tags="tags.slice(0, 12)" :domains="domains" />
    </div>
  </div>
</template>
