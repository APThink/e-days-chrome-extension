import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.js')
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es'
      },
      external: ['./config.js']
    },
    emptyOutDir: false
  },
  plugins: [
    {
      name: 'copy-files',
      closeBundle() {
        if (!existsSync('dist')) {
          mkdirSync('dist', { recursive: true });
        }
        
        copyFileSync('src/popup.html', 'dist/popup.html');
        copyFileSync('src/manifest.json', 'dist/manifest.json');
        
        if (existsSync('src/config.js')) {
          copyFileSync('src/config.js', 'dist/config.js');
        } else if (!existsSync('dist/config.js')) {
          const configContent = `export const config = {
  allowedUrl: 'https://your-company.e-days.com/TimeSubmission'
};`;
          writeFileSync('dist/config.js', configContent);
        }
      }
    }
  ]
});