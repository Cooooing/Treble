<script setup lang="ts">
  import { useData } from "vike-vue/useData";
  import { Data } from "./+data";

  const prefixCls = useDesign('index');
  const { rows } = useData<Data>();

</script>
<template>
  <article :class="prefixCls" class="wrapper p-4 flex">
    <ArticleCard mode="panel" :articles="rows" class="flex-1 w-1/3" />
    <aside class="w-100 flex-none"></aside>
  </article>
</template>

