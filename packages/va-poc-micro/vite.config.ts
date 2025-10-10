// @ts-nocheck
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  test: {
    environment: 'happy-dom',
  },
});
