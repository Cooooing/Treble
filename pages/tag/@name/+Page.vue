<script setup lang="ts">
import { useData } from "vike-vue/useData";
import ArticleCard from "@/components/ArticleCard";
import ContentSidebar from "@/components/ContentSidebar.vue";
import { Data } from "./+data";

const { articles, tag, tags, domains } = useData<Data>();
</script>

<template>
  <div class="main" v-if="tag">
    <div class="wrapper">
      <section class="content">
        <section class="module taxonomy-page__intro">
          <div class="module-panel">
            <div class="taxonomy-page__identity">
              <span
                v-if="tag.icon"
                class="avatar taxonomy-page__icon"
                :style="{ backgroundImage: `url(${tag.icon.startsWith('/v1/') ? `/api/bbs${tag.icon}` : tag.icon})` }"
                aria-hidden="true"
              ></span>
              <div>
                <h1><a rel="tag" :href="`/tag/${encodeURIComponent(tag.name || '')}`">{{ tag.name }}</a></h1>
                <p class="ft-fade">{{ tag.description || "暂无描述" }}</p>
              </div>
            </div>
          </div>
        </section>
        <ArticleCard :articles="articles" />
      </section>
      <ContentSidebar :tags="tags" :domains="domains" />
    </div>
  </div>
</template>
