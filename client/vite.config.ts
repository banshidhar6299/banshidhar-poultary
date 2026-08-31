import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'manifest.json'],
      manifest: {
        name: 'Banshidhar Poultry Management',
        short_name: 'Banshidhar Poultry',
        description: 'Complete Mobile-First Poultry Dealer Management Ecosystem',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5050',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5050',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (_err: any) => {
            // Ignore normal socket disconnects on restart/reload
          });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket: any) => {
            socket.on('error', (_err: any) => {
              // Ignore client socket errors (ECONNRESET/EPIPE)
            });
          });
          proxy.on('open', (proxySocket: any) => {
            proxySocket.on('error', (_err: any) => {
              // Ignore upstream proxy socket errors
            });
          });
        }
      }
    }
  }
});
