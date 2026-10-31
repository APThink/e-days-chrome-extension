import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/contentEntry.js')
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife'
      }
    }
  }
});
