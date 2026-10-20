import { ref } from "vue";
import { bbsClient } from "@/utils/sdk";

const channelName = "treble-notifications";

export const unreadNotificationCount = ref(0);

let channel: BroadcastChannel | undefined;
let refreshPromise: Promise<void> | undefined;

function notificationChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return undefined;
  channel ??= new BroadcastChannel(channelName);
  channel.onmessage = () => {
    void refreshUnreadNotificationCount();
  };
  return channel;
}

export function refreshUnreadNotificationCount() {
  refreshPromise ??= bbsClient.notification
    .countUnread({ body: {} })
    .then((response) => {
      unreadNotificationCount.value = response.count || 0;
    })
    .catch(() => undefined)
    .finally(() => {
      refreshPromise = undefined;
    });
  return refreshPromise;
}

export function notifyNotificationRead() {
  void refreshUnreadNotificationCount();
  notificationChannel()?.postMessage({ type: "read" });
}

export function initializeNotificationState() {
  notificationChannel();
}
