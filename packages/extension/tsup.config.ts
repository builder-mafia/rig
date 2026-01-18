import { defineConfig } from 'tsup';

export default defineConfig(options => ({
  entry: ['src/index.ts'],
  clean: true,
  target: 'es2022',
  format: ['cjs', 'esm'],
  dts: true,
  minify: !options.watch,
}));
