import { nextTick, onBeforeUnmount, ref, watch, type Ref } from "vue";

const bottomThreshold = 32;
const imageSettleTimeoutMs = 3_000;

export function useChatTimeline(timeline: Ref<HTMLElement | undefined>, content: Ref<HTMLElement | undefined>) {
  const followsLatest = ref(true);
  const pendingMessages = ref(0);
  let contentObserver: ResizeObserver | undefined;
  let scheduledScrollFrame: number | undefined;

  function isAtBottom() {
    const element = timeline.value;
    if (!element) return true;
    return (
      element.scrollHeight <= element.clientHeight ||
      element.scrollHeight - element.scrollTop - element.clientHeight <= bottomThreshold
    );
  }

  function handleScroll() {
    followsLatest.value = isAtBottom();
    if (followsLatest.value) pendingMessages.value = 0;
  }

  function scrollToLatest() {
    followsLatest.value = true;
    pendingMessages.value = 0;
    scheduleScrollToLatest();
  }

  function prepareAppend(forceFollow = false) {
    if (forceFollow) {
      followsLatest.value = true;
      pendingMessages.value = 0;
      return true;
    }
    followsLatest.value ||= isAtBottom();
    return followsLatest.value;
  }

  function recordPendingMessage() {
    pendingMessages.value += 1;
  }

  async function settleInitialRender() {
    followsLatest.value = true;
    await waitForRenderedImages();
    scrollToLatest();
  }

  async function preserveHistoryPosition(beforeHeight: number, beforeTop: number) {
    await waitForRenderedImages();
    const element = timeline.value;
    if (!element) return;
    element.scrollTop = beforeTop + element.scrollHeight - beforeHeight;
  }

  async function settleAppendedMessage(followedLatest: boolean) {
    await nextTick();
    if (followedLatest) scrollToLatest();
  }

  function scheduleScrollToLatest() {
    if (scheduledScrollFrame !== undefined) return;
    scheduledScrollFrame = requestAnimationFrame(() => {
      scheduledScrollFrame = undefined;
      const element = timeline.value;
      if (!element || !followsLatest.value) return;
      element.scrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
    });
  }

  async function waitForRenderedImages() {
    await nextTick();
    const images = Array.from(content.value?.querySelectorAll("img") || []);
    if (images.length === 0) return;
    await Promise.race([
      Promise.all(images.map(waitForImage)),
      new Promise<void>((resolve) => window.setTimeout(resolve, imageSettleTimeoutMs)),
    ]);
  }

  function observeContent(nextContent?: HTMLElement) {
    contentObserver?.disconnect();
    if (!nextContent || typeof ResizeObserver === "undefined") return;
    contentObserver = new ResizeObserver(() => {
      if (followsLatest.value) scheduleScrollToLatest();
    });
    contentObserver.observe(nextContent);
  }

  watch(content, observeContent, { immediate: true });

  onBeforeUnmount(() => {
    contentObserver?.disconnect();
    if (scheduledScrollFrame !== undefined) window.cancelAnimationFrame(scheduledScrollFrame);
  });

  return {
    pendingMessages,
    handleScroll,
    prepareAppend,
    preserveHistoryPosition,
    recordPendingMessage,
    scrollToLatest,
    settleAppendedMessage,
    settleInitialRender,
  };
}

function waitForImage(image: HTMLImageElement) {
  if (image.complete) return image.decode?.().catch(() => undefined) || Promise.resolve();
  return new Promise<void>((resolve) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => resolve(), { once: true });
  });
}
