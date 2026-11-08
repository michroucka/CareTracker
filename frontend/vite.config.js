import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
      tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow access from network
    port: 5173,
	allowedHosts: [
      'edmond-unrancored-avril.ngrok-free.dev'
    ],
    proxy: {
      '/api': {
        target: 'http://backend:8080',
        changeOrigin: true,
      }
    }
  }
})
