<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
  import { isVNode } from 'vue';
  import type { MessageInternalOptions, MessageType } from './types';

  const props = withDefaults(defineProps<MessageInternalOptions>(), {
    type: 'info',
    duration: 3000,
    showClose: undefined,
    closable: undefined,
  });

  const emit = defineEmits(['destroy']);
  const { prefixCls } = useDesign('message');

  const visible = ref(false);
  let timer: number | null = null;

  const alertTypeClassMap: Record<MessageType, string> = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
    loading: 'alert-info',
  };

  const alertClass = computed(() => alertTypeClassMap[props.type]);

  const showClose = computed(() => (props.showClose ?? props.closable ?? false) && props.type !== 'loading');

  const isRenderFn = computed(() => isVNode(props.message));

  const close = () => {
    if (!visible.value) return;
    visible.value = false;
    stopTimer();
  };

  const startTimer = () => {
    if (!props.duration || props.duration <= 0) return;
    stopTimer();
    timer = window.setTimeout(() => close(), props.duration);
  };

  const stopTimer = () => {
    if (!timer) return;
    window.clearTimeout(timer);
    timer = null;
  };

  const handleAfterLeave = () => {
    emit('destroy');
    props.onDestroy?.();
    props.onClose?.();
  };

  const handleClick = () => {
    props.onClick?.();
  };

  const transitionName = `${prefixCls}-fade`;

  onMounted(() => {
    visible.value = true;
    startTimer();
  });

  onBeforeUnmount(() => stopTimer());

  defineExpose({ close });
</script>

<template>
  <Transition :name="transitionName" @after-leave="handleAfterLeave">
    <div
      v-show="visible"
      :class="[prefixCls, 'w-full']"
      role="alert"
      @mouseenter="stopTimer"
      @mouseleave="startTimer"
      @click="handleClick"
    >
      <div class="alert alert-soft shadow-lg" :class="alertClass">
        <span v-if="props.type === 'loading'" class="loading loading-spinner text-base" />
        <component v-if="isRenderFn" :is="props.message" />
        <span v-else>{{ props.message }}</span>
        <button
          v-if="showClose"
          class="btn btn-ghost btn-xs ml-auto"
          type="button"
          aria-label="close toast message"
          @click.stop="close"
        >
          ✕
        </button>
      </div>
    </div>
  </Transition>
</template>

<style lang="less">
  @prefixCls: ~'@{name}-message';
  @fadeName: ~'@{prefixCls}-fade';

  .@{prefixCls} {
    min-width: 16rem;
  }

  .@{fadeName}-enter-from,
  .@{fadeName}-leave-to {
    opacity: 0;
    transform: translateY(-0.5rem) scale(0.98);
  }

  .@{fadeName}-enter-active,
  .@{fadeName}-leave-active {
    transition: all 0.2s ease;
  }
</style>
