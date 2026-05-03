import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: resolve(__dirname),
  plugins: [vue(), viteSingleFile()],
  build: {
    outDir: resolve(__dirname, '../dist/ui'),
    emptyOutDir: true,
  },
});
