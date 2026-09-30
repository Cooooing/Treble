<script lang="ts" setup>
defineProps<{ description?: string }>();
</script>

<template>
  <section class="no-list empty-state" role="status">
    <p class="empty-state__title">没有鸡，哪来的鸡蛋呢？</p>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
    <slot />
  </section>
</template>
