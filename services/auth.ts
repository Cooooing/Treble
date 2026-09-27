import { bbsClient } from "@/utils/sdk";
import { clearAuthState, restoreCurrentUser } from "@/utils/auth/state";

export async function loginByPassword(account: string, password: string) {
  await bbsClient.auth.login({
    loginReq: { type: "LOGIN_TYPE_PASSWORD", passwordCredential: { account, password } },
  });
  const currentAccount = await restoreCurrentUser();
  if (!currentAccount?.profile) throw new Error("登录状态恢复失败，请刷新页面后重试。");
}

export async function logout() {
  try {
    await bbsClient.auth.logout({ body: {} });
  } finally {
    clearAuthState();
  }
}
