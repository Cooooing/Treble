<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{ name: string; label?: string }>();

const iconModules = import.meta.glob<string>("./icons/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
});

const icon = computed(() => {
  const source = iconModules[`./icons/${props.name}.svg`];
  if (!source) return undefined;
  const match = source.match(/^\s*<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/i);
  if (!match) return undefined;
  return {
    viewBox: match[1].match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1] || "0 0 24 24",
    content: match[2],
  };
});
</script>

<template>
  <svg
    v-if="icon"
    :viewBox="icon.viewBox"
    aria-hidden="true"
    class="icon"
    focusable="false"
    v-html="icon.content"
  />
</template>

<style scoped>
.icon {
  fill: currentColor;
}
</style>
