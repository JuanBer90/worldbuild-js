import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(rootDir, 'src/index.ts'),
      name: 'WorldBuild',
      formats: ['es'],
      fileName: 'worldbuild-js',
    },
    rollupOptions: {
      external: ['three'],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  plugins: [
    dts({
      include: ['src'],
      exclude: ['src/data/world-land-points.json'],
      rollupTypes: true,
    }),
  ],
});
