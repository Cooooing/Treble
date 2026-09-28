<script setup lang="ts">
import { onMounted, toRefs } from "vue";
import { useData } from "vike-vue/useData";
import ArticleCard from "@/components/ArticleCard";
import { message } from "@/components/Message";
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
        <ArticleCard :articles="recents" compact title="最新" more="/recent" />
        <ArticleCard :articles="hots" compact title="最热" more="/hot" />
      </section>
    </div>
  </div>
</template>
