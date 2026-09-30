<script lang="ts" setup>
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
        <ArticleListPanel :articles="recents" compact more="/recent" title="最新" />
        <ArticleListPanel :articles="hots" compact more="/hot" title="最热" />
      </section>
    </div>
  </div>
</template>
