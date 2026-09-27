import type { PluginOption } from "vite";
import vue from "@vitejs/plugin-vue";
import vike from "vike/plugin";
import viteCompression from "vite-plugin-compression";
import type { ViteEnv } from "../../utils";

export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  const { VITE_COMPRESS } = viteEnv;

  const vitePlugins: (PluginOption | PluginOption[])[] = [vike(), vue()];

  VITE_COMPRESS &&
    vitePlugins.push(
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: "gzip",
        ext: ".gz",
        deleteOriginFile: false,
      }),
    );

  return vitePlugins;
}
