<script setup lang="ts">
import { onMounted, toRefs } from "vue";
import { useData } from "vike-vue/useData";
import ArticleListPanel from "@/components/article/ArticleListPanel.vue";
import { message } from "@/components/feedback/message";
import { Data } from "./+data";

const { recents, hots, contentError } = toRefs(useData<Data>());

onMounted(() => {
  if (contentError.value) message.error(contentError.value);
});
</script>
<template>
  <div class="main index">
    <div class="wrapper">
      <section class="index-main">
        <ArticleListPanel :articles="recents" compact title="最新" more="/recent" />
        <ArticleListPanel :articles="hots" compact title="最热" more="/hot" />
      </section>
    </div>
  </div>
</template>
