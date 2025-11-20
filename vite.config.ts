import { ConfigEnv, defineConfig, loadEnv, UserConfig } from "vite";
import path from "path";
import { wrapperEnv } from './build/utils';
import { createVitePlugins } from './build/vite/plugin';
import { include, exclude } from './build/vite/optimizer';

export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  const root = process.cwd();
  const env = loadEnv(mode, root);
  const viteEnv = wrapperEnv(env);
  const isBuild = command === 'build';
  const { VITE_DROP_CONSOLE } = viteEnv;

  return {
    root,
    resolve: {
      alias: {
        "~": path.resolve(__dirname, './components'),
        "@": path.resolve(__dirname, './'),
        "#": path.resolve(__dirname, './types'),
      },
    },
    server: {
      // Listening on all local IPs
      host: true,
      strictPort: false,
      open: false,
      cors: true,
      hmr: true,
      allowedHosts: true,
    },
    esbuild: {
      drop: VITE_DROP_CONSOLE ? ['console', 'debugger'] : [],
    },

    css: {
      preprocessorOptions: {
        less: {
          additionalData: '@import "./assets/styles/variables.module.less";',
          javascriptEnabled: true,
        },
      },
    },

    plugins: createVitePlugins(viteEnv, isBuild),
    optimizeDeps: {
      include,
      exclude,
    },
  }
});
