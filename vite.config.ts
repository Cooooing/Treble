import { ConfigEnv, defineConfig, loadEnv, UserConfig } from "vite";
import path from "path";
import { wrapperEnv } from "./build/utils";
import { createVitePlugins } from "./build/vite/plugin";
import { exclude, include } from "./build/vite/optimizer";
import { createBbsGateway, ensureCsrfCookie } from "./server/bbsGateway";

export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  const root = process.cwd();
  const env = loadEnv(mode, root);
  const serverEnv = loadEnv(mode, root, "");
  const viteEnv = wrapperEnv(env);
  const isBuild = command === "build";
  const bassRepo = path.resolve(serverEnv.BASS_REPO || process.env.BASS_REPO || path.resolve(root, "..", "Bass"));
  const bbsSdkSource = path.join(bassRepo, "common/proto/gen-sdk/typescript-fetch/bff_bbs/src");
  const bbsBffUrl = new URL(serverEnv.BBS_BFF_URL || "http://127.0.0.1:8001/");
  const { VITE_DROP_CONSOLE } = viteEnv;

  return {
    root,
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./components"),
        "@": path.resolve(__dirname, "./"),
        "#": path.resolve(__dirname, "./types"),
        "@bass/bbs-sdk-fetch": bbsSdkSource,
      },
    },
    server: {
      host: true,
      strictPort: false,
      open: false,
      cors: true,
      hmr: true,
      allowedHosts: true,
      fs: {
        allow: [root, bassRepo],
      },
      watch: {
        ignored: ["!**/common/proto/gen-sdk/typescript-fetch/bff_bbs/src/**"],
      },
    },
    esbuild: {
      drop: VITE_DROP_CONSOLE ? ["console", "debugger"] : [],
    },
    // Browser and SSR rendering libraries are emitted into dist/server instead of
    // duplicated in the runtime image's node_modules.
    ssr: {
      noExternal: ["lottie-web", "vditor"],
    },

    plugins: [
      ...createVitePlugins(viteEnv, isBuild),
      {
        name: "treble-bbs-session-gateway",
        configureServer(server) {
          server.middlewares.use(ensureCsrfCookie(false));
          server.middlewares.use("/api/bbs", createBbsGateway({ bffUrl: bbsBffUrl.toString(), isProduction: false }));
        },
      },
    ],
    optimizeDeps: {
      include,
      exclude,
    },
  };
});
