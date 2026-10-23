import { expect, test } from "@playwright/test";

test("chat history is at bottom after all message nodes update", async ({ page }) => {
  await page.route("**/api/bbs/v1/im/global-chat/messages/list", async (route) => {
    const rows = Array.from({ length: 50 }, (_, index) => ({
      id: String(50 - index),
      sender_id: "22",
      content: `测试消息 ${50 - index}`,
      message_type: "IM_MESSAGE_TYPE_TEXT",
      created_at: new Date().toISOString(),
      sender: { user_id: "22", name: "admin1", nickname: "管理员" },
    }));
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ code: 200, data: { rows } }) });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:2324/chat");
  await expect(page.locator(".global-chat__message")).toHaveCount(50);
  await expect(page.locator(".global-chat__content").last()).toHaveText("测试消息 50", { timeout: 20_000 });
  const timeline = page.locator(".global-chat__timeline");
  await expect
    .poll(async () => timeline.evaluate((element) => element.scrollHeight - element.clientHeight - element.scrollTop), {
      timeout: 20_000,
    })
    .toBe(0);
});

test("chat timeline stays at bottom after an image expands asynchronously", async ({ page }) => {
  await page.route("**/api/bbs/v1/im/global-chat/messages/list", async (route) => {
    const rows = Array.from({ length: 50 }, (_, index) => ({
      id: String(50 - index),
      sender_id: "22",
      content: index === 0 ? "![延迟图片](https://example.test/late-image.png)" : `测试消息 ${50 - index}`,
      message_type: "IM_MESSAGE_TYPE_TEXT",
      created_at: new Date().toISOString(),
      sender: { user_id: "22", name: "admin1", nickname: "管理员" },
    }));
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ code: 200, data: { rows } }) });
  });
  await page.route("https://example.test/late-image.png", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#ddd"/></svg>',
    });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:2324/chat");
  const timeline = page.locator(".global-chat__timeline");
  await expect(page.locator(".global-chat__content img")).toBeVisible();
  await expect
    .poll(async () => timeline.evaluate((element) => element.scrollHeight - element.clientHeight - element.scrollTop), {
      timeout: 20_000,
    })
    .toBe(0);
});
