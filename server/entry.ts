import ThemeHandlers from "./handlers/theme";
import { apply, serve } from "@photonjs/express";
import express from "express";
import session from "express-session";
import expressProxy from 'express-http-proxy'
import dotenv from 'dotenv'
import { RedisStore } from "connect-redis"
import redisClient from "./utils/redis";

export default await startServer();

async function startServer() {
  dotenv.config()
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 2324;
  const app = express();

  app.use(
    session({
      name: 'TREBLE_SESSION_ID',
      secret: process.env.SESSION_SECRET || 'treble_secret_key',
      store: new RedisStore({
        client: redisClient,
        prefix: 'treble_session:',        // session key 前缀（默认为 "sess:"）
      }),
      saveUninitialized: false,
      resave: false,
      cookie: { 
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 1000 * 365
      },
    })
  );

  const proxy = process.env.API_PROXY && JSON.parse(process.env.API_PROXY.replace(/'/g, '"')) || null;

  if (proxy) {
    for (const [prefix, target] of proxy) {
      const targetUrl = new URL(target);
      const { origin, pathname } = targetUrl;
      console.log(`Proxy setup: ${prefix} --> ${origin}${pathname}`);
      app.use(prefix, expressProxy(origin, {
        proxyReqPathResolver: req => req.originalUrl.replace(new RegExp(`^${prefix}`), pathname), // 按需映射路径
        userResDecorator: async (proxyRes, proxyBody, req, res) => {
          if (!req.url?.endsWith('/authentication/login/account')) {
            return proxyBody;
          }
          const contentType = proxyRes.headers['content-type'] || ''
          if (contentType.includes('application/json')) {
            const bodyString = proxyBody.toString('utf8')
            const { code, data } = JSON.parse(bodyString)
            if (code == 200) {
              // 登录成功
              const token = data.token;
              req.session.token = token;
              req.session.user = data.user;
              req.session.save();
            }
          }
          // 默认返回原始数据（Buffer）
          return proxyBody;
        },
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
          if (srcReq.session && srcReq.session.token) {
            proxyReqOpts.headers = {
              ...proxyReqOpts.headers,
              'Authorization': `Bearer ${srcReq.session.token}`,
            };
          }
          return proxyReqOpts;
        },
      }))
    }
  }

  await apply(app, ThemeHandlers);

  return serve(app, {
    port,
  });
}
