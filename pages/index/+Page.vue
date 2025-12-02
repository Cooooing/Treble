<script setup lang="ts">
  import { useData } from "vike-vue/useData";
  import { Data } from "./+data";

  const prefixCls = useDesign('index');
  const { recents, hots } = useData<Data>();

</script>
<template>
  <article :class="prefixCls" class="wrapper p-4">
    <section class="main-content flex gap-4">
      <ArticleCard :articles="recents" title="最近" more="/recent" class="flex-1 w-1/3" />
      <ArticleCard :articles="hots" title="热议" more="/hot" class="flex-1 w-1/3" />
      <section class="flex-1 w-1/3"></section>
    </section>
  </article>
</template>

