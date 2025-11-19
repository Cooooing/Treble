<script setup lang="ts">
  import { computed, unref, ref, RenderFunction } from 'vue';
  import { useDesign } from '@/hooks/useDesign';
  import { isString, isObject, isFunction, isNumber } from '@/utils';
  import { Icon as IconifyIcon } from '@iconify/vue';

  const { prefixCls } = useDesign('icon');

  const props = defineProps<{
    icon: string | Recordable | RenderFunction;
    color?: string;
    size?: string | number;
  }>();

  const isRenderable = computed(
    () =>
      isObject(props.icon) ||
      isFunction(props.icon),
  );

  const isLocal = computed(() => isString(props.icon) && props.icon.startsWith('svg-icon:'));

  const symbolId = computed(() => {
    return isString(props.icon) && unref(isLocal)
      ? `#icon-${props.icon.split('svg-icon:')[1]}`
      : props.icon;
  });

  const getIconStyle = computed(() => {
    const { color, size } = props;
    return {
      fontSize: isNumber(size) ? `${size}px` : size,
      color,
    };
  });
</script>

<template>
  <i :class="prefixCls" :style="getIconStyle">
    <component v-if="isRenderable" :is="icon" />

    <svg v-else-if="isLocal" aria-hidden="true">
      <use :xlink:href="symbolId" />
    </svg>

    <IconifyIcon v-else :icon="(symbolId as string)" />
  </i>
</template>

<style lang="less">
  @prefixCls: ~'@{name}-icon';

  .@{prefixCls} {
    height: 1em;
    width: 1em;
    line-height: 1em;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    position: relative;
    fill: currentColor;
    color: var(--color);
    font-size: inherit;

    svg {
      width: 1em;
      height: 1em;
      fill: currentColor;
    }
  }
</style>