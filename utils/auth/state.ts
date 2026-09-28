import { shallowRef } from "vue";
import type { RespCurrentAccount } from "@bass/bbs-sdk-fetch/models/RespCurrentAccount";
import { bbsClient } from "@/utils/sdk";

export const currentAccount = shallowRef<RespCurrentAccount>();

export function setCurrentAccount(account?: RespCurrentAccount) {
  if (typeof window === "undefined") return;
  currentAccount.value = account;
}

export async function restoreCurrentUser() {
  try {
    const response = await bbsClient.account.getCurrent({ body: {} });
    setCurrentAccount(response.account);
    return response.account;
  } catch {
    clearAuthState();
    return undefined;
  }
}

export function clearAuthState() {
  setCurrentAccount();
}
