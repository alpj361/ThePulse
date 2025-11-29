import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      '/api/sondeo': {
        target: 'http://127.0.0.1:3010',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sondeo/, '/api/sondeo')
      },
      '/api': {
        target: 'http://127.0.0.1:3010',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  optimizeDeps: {
    include: ['eventsource-parser', 'zod-to-json-schema', 'lucide-react', 'jspdf', 'html2canvas'],
    esbuildOptions: {
      resolveExtensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.mjs', '.cjs']
    }
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
});
