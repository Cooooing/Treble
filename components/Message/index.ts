import { createVNode, render } from 'vue';
import MessageVue from './src/Message.vue';
import type { MessageFn, MessageInternalOptions, MessageParams, MessageType, MessageHandler } from './src/types';
import { isClient, isString } from '@/utils/is';

const HOST_ID = 'treble-message-host';
const hostClass = 'toast toast-end fixed top-4 right-4 z-[9999] gap-3 flex flex-col';

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
    host = document.createElement('div');
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
    console.warn('[Message] Cannot render toast on the server.');
    return { id: '', close: () => undefined };
  }

  const normalized = normalizeOptions(options);
  if (!normalized.message) {
    throw new Error('[Message] `message` is required.');
  }

  const host = ensureHost();
  if (!host) {
    throw new Error('[Message] Failed to create host element.');
  }

  const id = normalized.id ?? `message_${++seed}`;
  const container = document.createElement('div');
  host.appendChild(container);

  const destroy = () => {
    render(null, container);
    container.remove();
    instances.delete(id);
    removeHostIfEmpty(host);
  };

  const vnode = createVNode(MessageVue, {
    ...normalized,
    id,
    onDestroy: destroy,
  });

  render(vnode, container);

  const handler: MessageHandler = {
    id,
    close: () => {
      vnode.component?.exposed?.close();
    },
  };

  instances.set(id, handler);

  return handler;
}

function createTypedMessage(type: MessageType) {
  return (message: MessageParams) => {
    const normalized = normalizeOptions(message);
    return createMessage({ ...normalized, type });
  };
}

const Message = ((options: MessageParams) => createMessage(options)) as MessageFn;

Message.success = createTypedMessage('success');
Message.info = createTypedMessage('info');
Message.warning = createTypedMessage('warning');
Message.error = createTypedMessage('error');
Message.loading = createTypedMessage('loading');

Message.closeAll = () => {
  instances.forEach((instance) => instance.close());
  instances.clear();
};

export default MessageVue;
export { Message };
export * from './src/types';
