<script lang="ts" setup>
import { usePageContext } from "vike-vue/usePageContext";
import ErrorState from "@/components/feedback/ErrorState.vue";

const pageContext = usePageContext();
let { is404, abortReason } = pageContext;
if (!abortReason) {
  abortReason = is404 ? "你访问的页面不存在，或尚未开放。" : "服务暂时开小差了，请稍后再试。";
}
</script>

<template>
  <ErrorState :title="is404 ? '页面未找到' : '暂时无法打开'" :message="abortReason" />
</template>
