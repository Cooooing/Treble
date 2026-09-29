<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { isVNode } from "vue";
import type { MessageInternalOptions, MessageType } from "./message.types";

const props = withDefaults(defineProps<MessageInternalOptions>(), {
  type: "info",
  duration: undefined,
  showClose: undefined,
  closable: undefined,
});

const emit = defineEmits(["destroy"]);
const visible = ref(false);
let timer: number | null = null;

const toastTypeClassMap: Record<MessageType, string> = {
  info: "site-message--info",
  success: "site-message--success",
  warning: "site-message--warning",
  error: "site-message--error",
  loading: "site-message--loading",
};

const toastClass = computed(() => toastTypeClassMap[props.type]);
const iconPath = computed(
  () =>
    ({
      info: "M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z",
      success: "M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20Zm-1.1 14.2-4-4l1.4-1.4l2.6 2.6l5-5l1.4 1.4-6.4 6.4Z",
      warning: "M12 2.8 1.7 20.5c-.4.7.1 1.5.9 1.5h18.8c.8 0 1.3-.8.9-1.5L12 2.8Zm1 15.4h-2v-2h2v2Zm0-4h-2V9h2v5.2Z",
      error:
        "M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20Zm3.7 12.3-1.4 1.4L12 13.4l-2.3 2.3-1.4-1.4 2.3-2.3-2.3-2.3 1.4-1.4 2.3 2.3 2.3-2.3 1.4 1.4-2.3 2.3 2.3 2.3Z",
      loading: "M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3Z",
    })[props.type],
);
const showClose = computed(() => (props.showClose ?? props.closable ?? false) && props.type !== "loading");
const isRenderFn = computed(() => isVNode(props.message));

function stopTimer() {
  if (timer === null) return;
  window.clearTimeout(timer);
  timer = null;
}

function close() {
  if (!visible.value) return;
  visible.value = false;
  stopTimer();
}

function startTimer() {
  const duration = props.duration ?? 3000;
  if (duration <= 0) return;
  stopTimer();
  timer = window.setTimeout(close, duration);
}

function handleAfterLeave() {
  emit("destroy");
  props.onDestroy?.();
  props.onClose?.();
}

onMounted(() => {
  visible.value = true;
  startTimer();
});

onBeforeUnmount(stopTimer);

defineExpose({ close });
</script>

<template>
  <Transition name="app-message-fade" @after-leave="handleAfterLeave">
    <div
      v-show="visible"
      class="site-message-item"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      @mouseenter="stopTimer"
      @mouseleave="startTimer"
      @click="props.onClick"
    >
      <div class="site-message" :class="toastClass">
        <svg class="site-message__icon" viewBox="0 0 24 24" aria-hidden="true"><path :d="iconPath" /></svg>
        <span class="site-message__content">
          <component v-if="isRenderFn" :is="props.message" />
          <template v-else>{{ props.message }}</template>
        </span>
        <button v-if="showClose" class="site-message__close" type="button" aria-label="关闭消息" @click.stop="close">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7.4 6 4.6 4.6L16.6 6 18 7.4 13.4 12l4.6 4.6-1.4 1.4-4.6-4.6L7.4 18 6 16.6l4.6-4.6L6 7.4 7.4 6Z" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style>
.site-message-host {
  position: fixed;
  top: 70px;
  left: 50%;
  z-index: 2147483647;
  width: min(32rem, calc(100vw - 2rem));
  pointer-events: none;
  transform: translateX(-50%);
}

.site-message-item {
  min-width: min(20rem, calc(100vw - 2rem));
  pointer-events: auto;
}

.site-message {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  margin-bottom: 8px;
  padding: 0.5rem 2.5rem;
  border: 1px solid var(--layer-border-color);
  border-radius: 8px;
  background: var(--layer-background-color);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  color: var(--text-color);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.site-message__content {
  min-width: 0;
  text-align: center;
}
.site-message__icon,
.site-message__close svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
.site-message__icon {
  position: absolute;
  left: 14px;
  color: var(--message-icon-color);
}
.site-message--info {
  --message-icon-color: #4285f4;
}
.site-message--success {
  --message-icon-color: #569e3d;
}
.site-message--warning {
  --message-icon-color: #e59230;
}
.site-message--error {
  --message-icon-color: #d23f31;
}
.site-message--loading .site-message__icon {
  animation: site-message-spin 0.8s linear infinite;
}

.site-message__close {
  position: absolute;
  top: 50%;
  right: 8px;
  display: inline-grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--text-fade-color);
  cursor: pointer;
  transform: translateY(-50%);
}

.site-message__close:focus-visible {
  outline: 2px solid var(--link-color);
  outline-offset: 2px;
}

.app-message-fade-enter-from,
.app-message-fade-leave-to {
  opacity: 0;
  transform: translateY(-0.75rem) scale(0.98);
}

.app-message-fade-enter-active {
  transition:
    opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.app-message-fade-leave-active {
  transition:
    opacity 0.14s ease-in,
    transform 0.14s ease-in;
}

html[data-theme="dark"] .site-message {
  border-color: #4b5563;
  background: #2f363d;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.32);
  color: #dbe4ee;
}

html[data-theme="dark"] .site-message--info {
  --message-icon-color: #79b8ff;
}
html[data-theme="dark"] .site-message--success {
  --message-icon-color: #56d364;
}
html[data-theme="dark"] .site-message--warning {
  --message-icon-color: #e3b341;
}
html[data-theme="dark"] .site-message--error {
  --message-icon-color: #ff7b72;
}
html[data-theme="dark"] .site-message__close:focus-visible {
  outline-color: #79b8ff;
}

@keyframes site-message-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-message--loading .site-message__icon {
    animation: none;
  }
  .app-message-fade-enter-active,
  .app-message-fade-leave-active {
    transition: none;
  }
}
</style>
