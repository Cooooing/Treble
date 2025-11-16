import { ConfigEnv, defineConfig, loadEnv, UserConfig } from "vite";
import path from "path";
import { wrapperEnv } from './build/utils';
import { createProxy } from './build/vite/proxy';
import { createVitePlugins } from './build/vite/plugin';
import { include, exclude } from './build/vite/optimizer';

export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  const root = process.cwd();
  const env = loadEnv(mode, root);
  const viteEnv = wrapperEnv(env);
  const isBuild = command === 'build';
  const { VITE_PORT, VITE_PROXY, VITE_DROP_CONSOLE } = viteEnv;

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
      port: VITE_PORT,
      strictPort: false,
      open: false,
      cors: true,
      hmr: true,
      // Load proxy configuration from .env
      proxy: createProxy(VITE_PROXY),
    },
    esbuild: {
      drop: VITE_DROP_CONSOLE ? ['console', 'debugger'] : [],
    },
    plugins: createVitePlugins(viteEnv, isBuild),
    optimizeDeps: {
      include,
      exclude,
    },
  }
});
