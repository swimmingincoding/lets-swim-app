import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative paths so it works on any domain or subdirectory
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
