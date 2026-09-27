<script setup lang="ts">
import { useData } from "vike-vue/useData";
import ArticleCard from "@/components/ArticleCard";
import ContentSidebar from "@/components/ContentSidebar.vue";
import { Data } from "./+data";

const { rows, tags, domains } = useData<Data>();
</script>
<template>
  <div class="main">
    <div class="wrapper">
      <section class="content"><ArticleCard :articles="rows" title="最热" /></section>
      <ContentSidebar :tags="tags" :domains="domains" />
    </div>
  </div>
</template>
