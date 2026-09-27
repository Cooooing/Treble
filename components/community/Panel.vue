<script setup lang="ts">
defineProps<{ title?: string; moreHref?: string; moreLabel?: string }>();
</script>

<template>
  <section class="module">
    <header v-if="title || moreHref" class="module-header">
      <h2 v-if="title">{{ title }}</h2>
      <a v-if="moreHref" class="fn-right" :href="moreHref">{{ moreLabel || "更多" }}</a>
    </header>
    <div class="module-panel"><slot /></div>
  </section>
</template>
