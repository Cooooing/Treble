import { Component, defineAsyncComponent } from 'vue';

const modules = import.meta.glob('./**/index.vue');
export const components: Record<string, Component> = {};
for (const path in modules) {
  const p = path.split('/')[1];
  components[p] = defineAsyncComponent(modules[path] as any);
}

const defaultModules = import.meta.glob('./**/index.ts', { eager: true });
for (const path in defaultModules) {
  const p = path.split('/')[1];
  if (!(defaultModules[path] as any)?.default) continue;
  components[p] = (defaultModules[path] as any).default;
}

export default components;