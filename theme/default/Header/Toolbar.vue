<script setup lang="ts">
  import { clientOnly } from 'vike-vue/clientOnly';
  import { usePageContext } from 'vike-vue/usePageContext'
  import { logout } from '@/apis/auth';
  import { reload } from 'vike/client/router';

  const page = usePageContext();
  function onLogout() {
    logout().then(() => {
      reload();
    });
  }

  const ThemeSwitchClientOnly = clientOnly(() => import('~/ThemeSwitch'));
</script>
<template>
  <section class="px-2 space-x-2 inline-flex items-center">
    <template v-if="!page.user">
      <ThemeSwitchClientOnly />
      <a href="/login" class="text-inherit">
        登录
      </a>
      <a href="/register" class="text-inherit">
        注册
      </a>
    </template>
    <template v-else>
      <ThemeSwitchClientOnly />
      <a role="button" href="/article/pre" class="btn btn-active btn-primary btn-sm">+ 发帖</a>
      <div class="dropdown dropdown-end">
        <Avatar :url="`https://treble.sxisa.com/api/user/v1/user/avatar/${page.user.name}`" :size="32" class="cursor-pointer" tabindex="0" />
        <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
          <li><a class="text-inherit">个人主页</a></li>
          <li><a class="text-inherit">设置</a></li>
          <li><a class="text-inherit" @click="onLogout">登出</a></li>
        </ul>
      </div>
    </template>
  </section>
</template>