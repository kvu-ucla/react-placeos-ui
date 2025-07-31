import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/control/**': {
        target: 'https://ucla-dev.placeos.run',
        secure: true,
        changeOrigin: true
      },
      '/auth/**': {
        target: 'https://ucla-dev.placeos.run',
        secure: true,
        changeOrigin: true
      },
      '/api/**': {
        target: 'https://ucla-dev.placeos.run',
        secure: true,
        changeOrigin: true,
        ws: true
      },
      '/styles/**': {
        target: 'https://ucla-dev.placeos.run',
        secure: true,
        changeOrigin: true
      },
      '/scripts/**': {
        target: 'https://ucla-dev.placeos.run',
        secure: true,
        changeOrigin: true
      },
      '/login/**': {
        target: 'https://ucla-dev.placeos.run',
        secure: true,
        changeOrigin: true
      },
      '/backoffice/**': {
        target: 'https://ucla-dev.placeos.run',
        secure: true,
        changeOrigin: true
      },
      '/control/websocket/**': {
        target: 'https://ucla-dev.placeos.run',
        secure: true,
        changeOrigin: true,
        ws: true
      }

    },
  },
});