<script setup lang="ts">
defineProps<{ name: string; label?: string }>();
</script>

<template>
  <svg aria-hidden="true" focusable="false"><use :href="`#${name}`" /></svg>
</template>
