import { apply, serve } from "@photonjs/express";
import express from "express";
import dotenv from "dotenv";
import { createBbsGateway, ensureCsrfCookie } from "./bbsGateway";

export default await startServer();

async function startServer() {
  dotenv.config();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 2324;
  const isDevelopment = process.env.NODE_ENV !== "production";
  const app = express();

  const bbsBffUrl = process.env.BBS_BFF_URL;
  if (!bbsBffUrl) {
    throw new Error("必须配置 BBS_BFF_URL");
  }

  console.log(`BBS 会话网关：/api/bbs --> ${bbsBffUrl}`);
  app.use(ensureCsrfCookie(!isDevelopment));
  app.use("/api/bbs", createBbsGateway({ bffUrl: bbsBffUrl, isProduction: !isDevelopment }));

  await apply(app, []);

  return serve(app, {
    port,
    onReady: () => {
      console.log(`服务已启动：http://localhost:${port}`);
    },
  });
}
