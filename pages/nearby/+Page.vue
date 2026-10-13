<script lang="ts" setup>
import { toRefs } from "vue";
import { useData } from "vike-vue/useData";
import ArticleListPanel from "@/components/article/ArticleListPanel.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";
import { Data } from "./+data";

const { rows, error } = toRefs(useData<Data>());
</script>

<template>
  <ErrorState v-if="error" :message="error" title="位置文章暂时无法打开" />
  <main v-else class="main">
    <div class="wrapper">
      <section class="content">
        <ArticleListPanel :articles="rows" empty-text="暂未找到你所在城市发布的文章。" title="位置" />
      </section>
    </div>
  </main>
</template>
