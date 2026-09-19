import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const playgroundDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(playgroundDir, '..');

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/worldbuild-js/' : '/',
  root: playgroundDir,
  resolve: {
    alias: [
      {
        find: 'worldbuild-js',
        replacement:
          command === 'build'
            ? resolve(rootDir, 'dist/worldbuild-js.js')
            : resolve(rootDir, 'src/index.ts'),
      },
    ],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
}));
