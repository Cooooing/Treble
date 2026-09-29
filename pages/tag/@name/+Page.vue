<script setup lang="ts">
import { useData } from "vike-vue/useData";
import { toRefs } from "vue";
import ArticleListPanel from "@/components/article/ArticleListPanel.vue";
import ContentSidebar from "@/components/layout/ContentSidebar.vue";
import AppLink from "@/components/ui/AppLink.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";
import { Data } from "./+data";

const { articles, tag, tags, domains } = toRefs(useData<Data>());
</script>

<template>
  <ErrorState
    v-if="!tag"
    :title="pageStatus === 404 ? '标签未找到' : '标签暂时无法打开'"
    :message="error || '标签暂时无法访问。'"
  />
  <div v-else class="main">
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
                <h1>
                  <AppLink rel="tag" :href="`/tag/${encodeURIComponent(tag.name || '')}`">{{ tag.name }}</AppLink>
                </h1>
                <p class="ft-fade">{{ tag.description || "暂无描述" }}</p>
              </div>
            </div>
          </div>
        </section>
        <ArticleListPanel :articles="articles" />
      </section>
      <ContentSidebar :tags="tags" :domains="domains" />
    </div>
  </div>
</template>
