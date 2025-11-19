<script setup lang="ts">
  import Menus from './Menus.vue';
import Toolbar from './Toolbar.vue';
</script>
<template>
  <header>
    <div class="navbar bg-base-100 shadow-sm">
      <div class="navbar-start">
        <Logo />
      </div>
      <div class="navbar-center hidden lg:flex">
        <Menus />
      </div>
      <div class="navbar-end">
        <input type="text" placeholder="搜索你感兴趣的内容" class="input input-bordered w-24 md:w-auto" />
        <Toolbar />
      </div>
    </div>
  </header>
</template>