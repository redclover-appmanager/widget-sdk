import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'es',
      sourcemap: true
    },
    plugins: [typescript()]
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [typescript()]
  },
  // UMD build (minified, for CDN)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/widget-sdk.min.js',
      format: 'umd',
      name: 'AppManagerWidgetSDK',
      sourcemap: true
    },
    plugins: [typescript(), terser()]
  }
];
