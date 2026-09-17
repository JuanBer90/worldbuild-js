import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const playgroundDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: playgroundDir,
  server: {
    open: true,
  },
});
