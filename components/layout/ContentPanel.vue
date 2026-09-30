<script lang="ts" setup>
import AppLink from "@/components/ui/AppLink.vue";

defineProps<{ title?: string; moreHref?: string; moreLabel?: string }>();
</script>

<template>
  <section class="module">
    <header v-if="title || moreHref" class="module-header">
      <h2 v-if="title">{{ title }}</h2>
      <AppLink v-if="moreHref" :href="moreHref" class="fn-right">{{ moreLabel || "更多" }}</AppLink>
    </header>
    <div class="module-panel"><slot /></div>
  </section>
</template>
