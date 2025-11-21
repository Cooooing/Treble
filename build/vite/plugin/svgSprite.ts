import { createSvgIconsSsrPlugin } from 'vite-plugin-svg-icons-ssr'
import path from 'path';
import type { PluginOption } from 'vite';

export function configSvgIconsPlugin(isBuild: boolean) {
  const svgIconsPlugin = createSvgIconsSsrPlugin({
    scanDir: path.resolve(process.cwd(), 'assets/icons'),
    svgoOptions: isBuild,
    symbolId: 'icon-[dir]-[name]',
  });
  return svgIconsPlugin as PluginOption;
}