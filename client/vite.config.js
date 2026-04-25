import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://miniprojetdev.onrender.com',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://miniprojetdev.onrender.com',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
