<script setup lang="ts">
  import Menus from './Menus.vue';
  import Toolbar from './Toolbar.vue';
</script>
<template>
  <header>
    <div class="navbar bg-base-100 shadow-sm justify-between">
      <div class="navbar-start w-auto!">
        <Logo />
      </div>
      <div class="navbar-center hidden lg:flex flex-1 justify-center">
        <Menus />
      </div>
      <div class="navbar-end w-auto! flex-1">
        <input type="text" placeholder="搜索你感兴趣的内容" class="input input-bordered w-42 md:inline-flex hidden" />
        <Toolbar />
      </div>
    </div>
    <div class="md:hidden flex">
      <Menus class="justify-between w-full bg-base-200" />
    </div>
  </header>
</template>