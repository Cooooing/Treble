<script setup lang="ts">
import AppLink from "@/components/ui/AppLink.vue";

defineProps<{ title?: string; moreHref?: string; moreLabel?: string }>();
</script>

<template>
  <section class="module">
    <header v-if="title || moreHref" class="module-header">
      <h2 v-if="title">{{ title }}</h2>
      <AppLink v-if="moreHref" class="fn-right" :href="moreHref">{{ moreLabel || "更多" }}</AppLink>
    </header>
    <div class="module-panel"><slot /></div>
  </section>
</template>
