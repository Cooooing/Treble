import { createVNode, render } from "vue";
import MessageVue from "./src/Message.vue";
import type { MessageFn, MessageInternalOptions, MessageParams, MessageType, MessageHandler } from "./src/types";
import { isClient, isString } from "@/utils/is";

const HOST_ID = "site-message-host";
const hostClass = "site-message-host";
const maxCount = 3;

const instances = new Map<string, MessageHandler>();
let seed = 0;

function normalizeOptions(options: MessageParams): MessageInternalOptions {
  if (isString(options)) {
    return { message: options };
  }

  return options;
}

function ensureHost(): HTMLElement | null {
  if (!isClient) return null;

  let host = document.getElementById(HOST_ID) as HTMLElement | null;
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    host.className = hostClass;
    document.body.appendChild(host);
  }

  return host;
}

function removeHostIfEmpty(host: HTMLElement) {
  if (host.childElementCount > 0) return;
  host.remove();
}

function createMessage(options: MessageParams): MessageHandler {
  if (!isClient) {
    return { id: "", close: () => undefined };
  }

  const normalized = normalizeOptions(options);
  if (!normalized.message) {
    throw new Error("[Message] `message` is required.");
  }

  const host = ensureHost();
  if (!host) {
    throw new Error("[消息组件] 创建挂载元素失败。");
  }

  const id = normalized.id ?? `message_${++seed}`;
  instances.get(id)?.close();
  const container = document.createElement("div");
  host.appendChild(container);

  let handler: MessageHandler;

  const destroy = () => {
    render(null, container);
    container.remove();
    if (instances.get(id) === handler) instances.delete(id);
    removeHostIfEmpty(host);
  };

  const vnode = createVNode(MessageVue, {
    ...normalized,
    id,
    onDestroy: destroy,
  });

  render(vnode, container);

  handler = {
    id,
    close: () => {
      vnode.component?.exposed?.close();
    },
  };

  instances.set(id, handler);

  if (instances.size > maxCount) {
    const oldest = instances.values().next().value as MessageHandler | undefined;
    oldest?.close();
  }

  return handler;
}

function createTypedMessage(type: MessageType) {
  return (message: MessageParams, options?: Omit<MessageInternalOptions, "message" | "type" | "onDestroy">) => {
    const normalized = normalizeOptions(message);
    return createMessage({ ...normalized, ...options, type });
  };
}

const Message = ((options: MessageParams) => createMessage(options)) as MessageFn;

Message.success = createTypedMessage("success");
Message.info = createTypedMessage("info");
Message.warning = createTypedMessage("warning");
Message.error = createTypedMessage("error");
Message.loading = createTypedMessage("loading");

Message.closeAll = () => {
  instances.forEach((instance) => instance.close());
  instances.clear();
};

export default MessageVue;
export { Message, Message as message };
export * from "./src/types";
