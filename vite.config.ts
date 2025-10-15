import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'eventsource-parser': 'eventsource-parser',
      'zod-to-json-schema': 'zod-to-json-schema'
    },
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      '/api/sondeo': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sondeo/, '/api/sondeo')
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  optimizeDeps: {
    include: ['eventsource-parser', 'zod-to-json-schema']
  },
});
