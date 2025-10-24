/**
 * @ldesign/builder 配置
 */

import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  entry: 'src/index.ts',
  output: {
    formats: ['esm', 'cjs'],
    dir: {
      esm: 'es',
      cjs: 'lib',
    },
  },
  external: [
    'vue',
    'react',
    'react-dom',
    'web-vitals',
    'rrweb',
    'rrweb-player',
    'source-map',
    '@ldesign/logger',
    '@ldesign/http',
    '@ldesign/shared',
  ],
  minify: false,
  sourcemap: true,
  dts: true,
  clean: true,
})



