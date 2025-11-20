import ThemeHandlers from "./handlers/theme";
import { apply, serve } from "@photonjs/express";
import express from "express";
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv'
dotenv.config()

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 2324;

export default await startServer();

async function startServer() {
  const app = express();

  const proxy = process.env.API_PROXY && JSON.parse(process.env.API_PROXY.replace(/'/g, '"')) || null;
  if (proxy) {
    for (const [prefix, target] of proxy) {
      console.log(`Proxy setup: ${prefix} -> ${target}`);
      
      app.use(
        prefix,
        createProxyMiddleware({
          target,
          changeOrigin: true,
          pathRewrite: {
            [`^${prefix}`]: '',
          },
        })
      );
    }
  }

  await apply(app, ThemeHandlers);

  return serve(app, {
    port,
  });
}
