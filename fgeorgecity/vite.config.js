import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://georgecity-server.onrender.com',
        changeOrigin: true,
        ws: true,
      }
    }
  },
  output: {
    codeSplitting: {
      minSize: 20000,
      groups: [
        {
          name: 'vendor',
          test: /node_modules/,
        },
      ],
    },
  },
})
