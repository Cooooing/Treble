<script setup lang="ts">
  import { useDaisyUI } from '@/stores/useDaisyUI';
  import Vditor from 'vditor';

  const props = defineProps<{
    md: string;
    html?: string;
  }>();
  const render = ref(true);
  const contentRef = ref<HTMLDivElement>();

  function mdRender(daisyuiTheme: ReturnType<typeof useDaisyUI>) {
    if (!contentRef.value) return
    Vditor.preview(
      contentRef.value, 
      props.md,
      {
        mode: daisyuiTheme.isDarkTheme ? 'dark' : 'light',
        hljs: {
          style: daisyuiTheme.hlTheme,
          lineNumber: true,
          enable: true,
        },
        anchor: 1,
        after() {
          render.value = false;
        },
        transform: (html: string) => {
          return html
            .replace(/<table/g, `<div 
            class="overflow-x-auto rounded-box border border-base-content bg-base-100 max-h-96">
            <table class="table table-zebra table-pin-rows table-pin-cols"`)
            .replace(/<\/table>/g, '</table></div>');
        }
      },
    );
  }

  onMounted(() => {
    const daisyuiTheme = useDaisyUI();
    if (props.md && contentRef.value) {
      mdRender(daisyuiTheme);
      watch(() => daisyuiTheme.hlTheme, () => {
        mdRender(daisyuiTheme);
      });
    }
  })
</script>
<template>
  <div v-bind="$attrs" v-show="render && props.html" v-html="props.html"></div>
  <div v-bind="$attrs" v-if="md" v-show="!render" ref="contentRef"></div>
</template>