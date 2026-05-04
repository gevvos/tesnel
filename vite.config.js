import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: ['lib/**/*.ts'],
      exclude: ['lib/**/*.test.ts'],
    }),
  ],
  build: {
    target: 'esnext',
    emptyOutDir: false,
    lib: {
      entry: {
        'tesnel': resolve(__dirname, 'lib/index.ts'),
        'cli': resolve(__dirname, 'lib/cli/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => {
        if (id.startsWith('@modelcontextprotocol/')) return true;
        if (id.startsWith('zod')) return true;
        return [
          'oxc-parser', 'oxc-resolver', 'cac', '@vue/compiler-sfc',
          'fs', 'path', 'url', 'node:fs', 'node:path', 'node:url', 'node:process',
        ].includes(id);
      },
    },
  },
})
