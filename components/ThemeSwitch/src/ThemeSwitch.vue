<script setup lang="ts">
  import ThemeIcon from './ThemeIcon.vue';
  const themeList = reactive([
    'fishpi',
    'dark', //
    'emerald', 
    'cyberpunk',
    'valentine',
    'halloween',//
    'forest', //
    'dracula', //
    'business', //
    'lemonade', 
    'night', //
    'coffee', //
    'winter', 
  ]);
  const currentTheme = ref(localStorage.getItem('theme') || 'fishpi');
  function setTheme(t:string) {
    currentTheme.value = t;
    localStorage.setItem('theme', t);
  }
</script>

<template>
  <div class="dropdown dropdown-end">
    <a tabindex="0" role="button" class="btn group btn-sm gap-1.5 px-1.5 btn-ghost" aria-label="主题设置">
      <ThemeIcon />
      <Icon icon="formkit:down" />
      <input type="checkbox" :checked="true" class="theme-controller hidden" :value="currentTheme" />
    </a>
    <div tabindex="-1" class="dropdown-content bg-base-200 text-base-content rounded-box top-px h-122 max-h-[calc(100vh-8.6rem)] overflow-y-auto border-(length:--border) border-white/5 shadow-2xl outline-(length:--border) outline-black/5 mt-8">
      <ul class="menu w-56" id="theme-menu">
        <li class="menu-title text-xs">主题色</li>
        <li v-for="theme in themeList" :key="theme">
          <div @click="setTheme(theme)" role="button"  class="gap-3 px-2 [&_svg]:visible" :data-set-theme="theme" data-act-class="[&_svg]:visible">
            <ThemeIcon :theme="theme" />
            <div class="w-32 truncate">{{theme}}</div>
            <Icon icon="mingcute:check-line" v-if="theme === currentTheme" class="invisible h-3 w-3 shrink-0" />
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>