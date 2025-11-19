<script setup lang="ts">
  import { name } from './index';
  import { useDesign } from '@/hooks/useDesign';
  import Header from './Header/Header.vue';
  import Footer from './Footer/Footer.vue';
  import Content from './Content/Content.vue';

  defineOptions({ name: name + '-layout' });
  const { prefixCls } = useDesign('layout');
</script>

<template>
  <article class="layout bg-base-300" :class="prefixCls">
    <Header :class="`${prefixCls}-header`"></Header>
    <Content :class="`${prefixCls}-content`">
      <template #default>
        <slot />
      </template>
    </Content>
    <Footer :class="`${prefixCls}-footer`"></Footer>
  </article>
</template>

<style lang="less" scoped>
  @prefixCls: ~'@{name}-layout';

  .@{prefixCls} {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    &-header {
      flex: 0 0 auto;
    }
    &-content {
      flex: 1 0 auto;
    }
    &-footer {
      flex: 0 0 auto;
    }
  }
</style>