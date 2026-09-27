import type { RespCurrentAccount } from "@bass/bbs-sdk-fetch/models/RespCurrentAccount";
import type { Theme } from "@/utils/theme";

declare global {
  namespace Vike {
    interface PageContext {
      title?: string;
      theme?: Theme;
      user?: RespCurrentAccount;
    }
  }

  interface HTMLElement {
    showModal?: () => void;
    close?: () => void;
  }
}
