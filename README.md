# Treble

Treble 是 BBS 的 SSR 前端。它只消费相邻 Bass 工作区本地生成的
`@bass/bbs-sdk-fetch`。

## 请求与认证边界

```
浏览器 ── /api/bbs/v1/... ──> Treble BBS 网关 ──> Bass BBS BFF
                                   │
                                   └── Redis：sid 对应的 Bass 双 Token
```

浏览器只持有 HttpOnly 的 `treble.sid` 和 CSRF Cookie。网关从 Redis 读取
Bass access/refresh token，负责注入 `Authorization`、刷新 token、CSRF 与请求 ID。
页面 SSR 可恢复当前安全账户资料，但不会把 sid 或 token 写入 HTML。

## 目录

| 目录          | 职责                                                                     |
| ------------- | ------------------------------------------------------------------------ |
| `pages/`      | Vike 文件路由、页面数据加载、SSR 用户恢复与私有页守卫。                  |
| `layouts/`    | 唯一全局页面壳：顶栏、内容区和页脚。                                     |
| `components/` | 可复用 Vue 视图组件；不承载 BFF 协议或会话逻辑。                         |
| `services/`   | 按认证、内容、评论、社区划分的薄业务组合层；入参与返回值来自 SDK。       |
| `utils/sdk/`  | 唯一的生成 SDK 客户端、同源代理 URL、BFF envelope 和错误处理中间件。     |
| `utils/auth/` | 浏览器当前账户的非敏感 UI 状态。                                         |
| `server/`     | Express/Photon 入口、BBS 网关与 Redis sid 会话。                         |
| `assets/`     | 唯一的前端资源目录：主题 CSS、图片和图标精灵均由 Vite 构建并带版本指纹。 |
| `build/`      | Vite 插件与依赖预构建配置。                                              |
| `types/`      | Vue 与全局 TypeScript 声明。                                             |

`dist/`、`node_modules/`、`.gitnexus/`、IDE 配置、agent 上下文和本机 `.env`
都不是源码，必须保持未跟踪。

### 资源与样式约定

`assets/site/` 是页面静态资源与全局样式的唯一入口：图片通过模块 import，
图标精灵通过 `?url` 注入，样式从 `assets/site/styles/site.css` 统一加载。
项目不使用 `public/` 作为第二个静态文件根目录，也不保留 Less 或 Tailwind；组件样式
只使用原生 CSS，且颜色、间距和主题状态引用全局语义变量。

## 本地开发

先在 Bass 生成 BBS SDK：

```sh
make -C ../Bass/app/bbs sdk-typescript-fetch
```

然后在 Treble 创建本机配置并启动：

```sh
cp .env.example .env
pnpm install
pnpm dev
```

`BASS_REPO` 未设置时，默认使用相邻的 `../Bass`。Vite 会直接读取并监听
`common/proto/gen-sdk/typescript-fetch/bff_bbs/src`；重新生成 SDK 后应刷新浏览器。

`.env` 仅供本机 Node 服务读取，至少配置：

| 变量          | 用途                                                  |
| ------------- | ----------------------------------------------------- |
| `BBS_BFF_URL` | 唯一 BBS BFF 地址，开发默认 `http://127.0.0.1:8001`。 |
| `REDIS_URL`   | Treble 私有 Redis，会话存储使用。                     |
| `PORT`        | Treble Node 服务端口，默认 `2324`。                   |
| `BASS_REPO`   | 可选的 Bass 本地仓库路径。                            |

不要把真实密码、token 或机器绝对路径提交到 Git；只更新 `.env.example` 中的脱敏示例。

## 验证与构建

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm preview
```

日常编辑可运行 `pnpm format` 自动格式化，或运行 `pnpm lint:fix` 修复 ESLint
能够安全自动修复的问题。项目根目录的 `.editorconfig` 提供跨编辑器的一致缩进、
换行和字符集约定。

### 编辑器统一格式化

项目中的 `prettier.config.js` 是所有文件（包括 `.vue`）的唯一 formatter 配置，确保 IDEA
和 VS Code 的结果完全一致。Prettier 的 Vue 模板换行规则不可按单个标签微调；不要改用 IDE
原生 formatter，否则会重新引入团队格式差异。

VS Code 会读取提交的 `.vscode/settings.json`；安装推荐的 Prettier、ESLint 与 Volar 扩展后，
保存即格式化并运行 ESLint 自动修复。

IDEA 中在 **Settings → Languages & Frameworks → JavaScript → Prettier** 选择
**Automatic Prettier configuration**，并在 **Settings → Tools → Actions on Save** 启用
**Run Prettier**。在 ESLint 页面选择 **Automatic ESLint configuration**，再启用
**Run eslint --fix**。不要启用 IDEA 的 **Reformat code** 作为 Vue formatter。

开发环境在浏览器 Network 中应能看到 `/api/bbs/v1/...` 请求和
`X-Treble-Proxy-Request-ID`，可用同一请求 ID 在 Treble 与 Bass 日志中关联排查。

容器镜像仅封装已构建的 `dist/`，因此先在有本地 Bass SDK 的环境执行 `pnpm build`，
再执行 `docker build -t treble .`。运行时通过容器环境变量提供 `BBS_BFF_URL`、
`REDIS_URL` 与 `PORT`，不复制 `.env` 到镜像。
