import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    middleware: true,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    fs: {
      deny: ['.env', '.env.*.local'],
    },
    middlewareMode: false,
    // Forward backend routes to FastAPI on :8000 during dev
    proxy: {
      '/api':    { target: 'http://localhost:8000', changeOrigin: true },
      '/dss':    { target: 'http://localhost:8000', changeOrigin: true },
      '/auth':   { target: 'http://localhost:8000', changeOrigin: true },
      '/chat':   { target: 'http://localhost:8000', changeOrigin: true },
      '/upload': { target: 'http://localhost:8000', changeOrigin: true },
      '/static': { target: 'http://localhost:8000', changeOrigin: true },
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5174,
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash][extname]',
      },
    },
  },
})
