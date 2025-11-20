import type { VNodeChild } from 'vue';

export type MessageType = 'info' | 'success' | 'warning' | 'error' | 'loading';

export interface MessageOptions {
  id?: string;
  type?: MessageType;
  message: string | VNodeChild;
  duration?: number;
  showClose?: boolean;
  closable?: boolean;
  onClose?: () => void;
  onClick?: () => void;
}

export interface MessageInternalOptions extends MessageOptions {
  onDestroy?: () => void;
}

export interface MessageHandler {
  id: string;
  close: () => void;
}

export type MessageParams = MessageOptions | string;

export type MessageTypedFn = (message: MessageParams) => MessageHandler;

export interface MessageFn extends MessageTypedFn {
  success: MessageTypedFn;
  info: MessageTypedFn;
  warning: MessageTypedFn;
  error: MessageTypedFn;
  loading: MessageTypedFn;
  closeAll: () => void;
}
