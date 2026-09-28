<script setup lang="ts">
import { useData } from "vike-vue/useData";
import { toRefs } from "vue";
import ArticleCard from "@/components/ArticleCard";
import ContentSidebar from "@/components/ContentSidebar.vue";
import { Data } from "./+data";

const { rows, tags, domains } = toRefs(useData<Data>());
</script>
<template>
  <div class="main">
    <div class="wrapper">
      <section class="content"><ArticleCard :articles="rows" title="最新" /></section>
      <ContentSidebar :tags="tags" :domains="domains" />
    </div>
  </div>
</template>
