<script lang="ts" setup>
import type { Component } from "vue";
import { onMounted, ref } from "vue";

defineProps<{
  is?: string | Component;
}>();

const mounted = ref(false);

onMounted(() => {
  mounted.value = true;
});
</script>
<template>
  <component :is="is || 'div'" v-bind="$attrs">
    <slot v-if="mounted"></slot>
  </component>
</template>
