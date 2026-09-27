<script setup lang="ts">
import Sidebar from "@/components/community/Sidebar.vue";
import type { RespDomain } from "@bass/bbs-sdk-fetch/models/RespDomain";
import type { RespTag } from "@bass/bbs-sdk-fetch/models/RespTag";

const props = defineProps<{ tags?: RespTag[]; domains?: RespDomain[] }>();
</script>

<template>
  <Sidebar :tags="props.tags" :domains="props.domains" />
</template>
