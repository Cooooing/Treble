<script lang="ts" setup>
import { onServerPrefetch, ref, watch } from "vue";

const props = defineProps<{ name: string; label?: string }>();

const iconModules = import.meta.glob<string>("./icons/*.svg", { query: "?raw", import: "default" });
const viewBox = ref("");
const content = ref("");

async function loadIcon(name: string) {
  const load = iconModules[`./icons/${name}.svg`];
  if (!load) {
    viewBox.value = "";
    content.value = "";
    return;
  }

  const source = await load();
  const match = source.match(/^\s*<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/i);
  if (!match) {
    viewBox.value = "";
    content.value = "";
    return;
  }

  viewBox.value = match[1].match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1] || "0 0 24 24";
  content.value = match[2];
}

watch(
  () => props.name,
  (name) => void loadIcon(name),
  { immediate: true },
);

onServerPrefetch(() => loadIcon(props.name));
</script>

<template>
  <svg v-if="content" :viewBox="viewBox" aria-hidden="true" class="icon" focusable="false" v-html="content" />
</template>

<style scoped>
.icon {
  fill: currentColor;
}
</style>
