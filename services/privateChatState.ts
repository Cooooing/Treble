import { ref } from "vue";
import { bbsClient } from "@/utils/sdk";

const channelName = "treble-private-chat";

export const unreadPrivateChatCount = ref(0);

let channel: BroadcastChannel | undefined;
let refreshPromise: Promise<void> | undefined;
let refreshAfterCurrent = false;

function privateChatChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return undefined;
  channel ??= new BroadcastChannel(channelName);
  channel.onmessage = () => void refreshUnreadPrivateChatCount();
  return channel;
}

export function refreshUnreadPrivateChatCount() {
  refreshPromise ??= bbsClient.privateChat
    .countPrivateChatUnread({ body: {} })
    .then((response) => {
      unreadPrivateChatCount.value = Number(response.count || 0);
    })
    .catch(() => undefined)
    .finally(() => {
      refreshPromise = undefined;
      if (!refreshAfterCurrent) return;
      refreshAfterCurrent = false;
      void refreshUnreadPrivateChatCount();
    });
  return refreshPromise;
}

export function notifyPrivateChatRead() {
  refreshAfterCurrent ||= Boolean(refreshPromise);
  void refreshUnreadPrivateChatCount();
  privateChatChannel()?.postMessage({ type: "read" });
}

export function initializePrivateChatState() {
  privateChatChannel();
}
