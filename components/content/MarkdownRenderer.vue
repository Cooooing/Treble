<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { defaultTheme, isDarkTheme, type Theme } from "@/utils/theme";
import "vditor/dist/index.css";

const props = defineProps<{
  md: string;
  html?: string;
}>();
const emit = defineEmits<{
  (event: "rendered", headings: Array<{ id: string; level: number; text: string }>): void;
}>();
const render = ref(true);
const contentRef = ref<HTMLDivElement>();
let vditor: typeof import("vditor").default | undefined;

function mdRender(theme: Theme) {
  if (!contentRef.value || !vditor) return;
  vditor.preview(contentRef.value, props.md, {
    mode: isDarkTheme(theme) ? "dark" : "light",
    hljs: {
      style: isDarkTheme(theme) ? "github-dark" : "github",
      lineNumber: true,
      enable: true,
    },
    anchor: 1,
    after() {
      render.value = false;
      const headings = Array.from(contentRef.value?.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6") || [])
        .map((heading, index) => {
          const id = heading.id || `article-heading-${index + 1}`;
          heading.id = id;
          return { id, level: Number(heading.tagName.slice(1)), text: heading.textContent?.trim() || "" };
        })
        .filter((heading) => heading.text);
      emit("rendered", headings);
    },
    transform: (html: string) => {
      return html
        .replace(
          /<table/g,
          `<div
            class="table-wrap"><table`,
        )
        .replace(/<\/table>/g, "</table></div>");
    },
  });
}

function handleThemeChange(event: Event) {
  mdRender((event as CustomEvent<Theme>).detail);
}

onMounted(async () => {
  const theme = ref<Theme>(defaultTheme);
  if (props.md && contentRef.value) {
    theme.value = document.documentElement.dataset.theme === "dark" ? "dark" : defaultTheme;
    // Vditor writes to browser globals during module evaluation. Loading it only
    // after mount keeps the rendered HTML available to SSR and Vite's server runtime.
    vditor = (await import("vditor")).default;
    mdRender(theme.value);
    window.addEventListener("treble-theme-change", handleThemeChange);
  }
});

onUnmounted(() => window.removeEventListener("treble-theme-change", handleThemeChange));
</script>
<template>
  <div v-bind="$attrs" v-show="render && props.html" v-html="props.html"></div>
  <div v-bind="$attrs" v-if="md" v-show="!render" ref="contentRef"></div>
</template>
