import { apply, serve } from "@photonjs/express";
import express from "express";
import dotenv from "dotenv";
import { createBbsGateway, ensureCsrfCookie } from "./bbsGateway";
import { pageStatusMiddleware } from "./pageStatus";

export default await startServer();

async function startServer() {
  dotenv.config();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 2324;
  const isDevelopment = process.env.NODE_ENV !== "production";
  const cookieSecureOverride = process.env.TREBLE_COOKIE_SECURE;
  if (cookieSecureOverride !== undefined && cookieSecureOverride !== "true" && cookieSecureOverride !== "false") {
    throw new Error("TREBLE_COOKIE_SECURE 必须为 true 或 false");
  }
  const secureCookies = cookieSecureOverride === undefined ? !isDevelopment : cookieSecureOverride === "true";
  const app = express();

  const bbsBffUrl = process.env.BBS_BFF_URL;
  if (!bbsBffUrl) {
    throw new Error("必须配置 BBS_BFF_URL");
  }

  console.log(`BBS 会话网关：/api/bbs --> ${bbsBffUrl}`);
  app.use(ensureCsrfCookie(secureCookies));
  app.use("/api/bbs", createBbsGateway({ bffUrl: bbsBffUrl, isProduction: secureCookies }));

  await apply(app, [pageStatusMiddleware]);

  return serve(app, {
    port,
    onReady: () => {
      console.log(`服务已启动：http://localhost:${port}`);
    },
  });
}
