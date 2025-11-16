import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

import AutoImport from 'unplugin-auto-import/vite';

export function autoImports(_env?: ViteEnv, _isBuild?: boolean) {
  return [
    AutoImport({
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/,
      ],
      imports: [
        'vue',
        'vue-router',
        {
          '@/configs/env': ['getEnv', 'getEnvMode', 'isDevMode', 'isProdMode'],
          '@/utils/log': ['$log'],
          '@/utils/cache': ['Storage'],
          '@/libraries/propTypes': ['propTypes'],
          '@/libraries/vui': ['$message', '$notify', '$alert', '$confirm', '$prompt', '$loading'],
          '@/store/modules/user': ['useUserStoreWithOut'],
          '@/locales/useI18n': ['useI18n'],
          '@/hooks/web/useDesign': ['useDesign'],
          '@/hooks/web/useRouter': ['useXRouter'],
          '@/hooks/event/useEventListener': ['useEventListener'],
          '@/components/XDialog': ['useXDialog'],
        },
      ],
      dts: 'types/imports-auto.d.ts',
      resolvers: [ElementPlusResolver({ importStyle: false })],
    }),
    Components({
      // 自动加载的组件目录，默认值为 ['src/components']
      dirs: ['src/components'],
      // 文件后缀
      extensions: ['vue', 'ts'],
      /** 组件名称包含目录，防止同名组件冲突 */
      directoryAsNamespace: true,
      // 指定类型声明文件，为true时在项目根目录创建
      dts: 'types/components-auto.d.ts',
      // 导入路径变换
      importPathTransform: (path) => path.replace(/^.+?\/src/, '@'),
      // 解析器
      resolvers: [ElementPlusResolver({ importStyle: false })],
    }),
  ];
}
