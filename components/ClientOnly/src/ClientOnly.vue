<script setup lang="ts">
  import type { Component } from 'vue';

  defineProps<{
    is?: string | Component
  }>()
</script>
<template>
  <component :is="is || 'div'" v-bind="$attrs">
    <slot></slot>
  </component>
</template>