import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext',
    lib: {
      entry: {
        'tesnel': resolve(__dirname, 'lib/index.ts'),
      },
      name: 'tesnel',
      formats: ['es'],
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue', 'oxc-parser', 'oxc-resolver', 'fs'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})