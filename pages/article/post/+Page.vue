<script setup lang="ts">
  import ArticleForm from "@/pages/article/ArticleForm.vue";
  import { getObjOfUrl } from "@/utils";
  import { usePageContext } from "vike-vue/usePageContext";

  const pageContext = usePageContext();
  const { type } = getObjOfUrl(pageContext.urlOriginal);
</script>
<template>
  <ArticleForm :type="Number(type)" />
</template>
