import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { authPlugin } from './vite-plugin-auth'; // File missing
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom middleware plugin for saving JSON DB
    {
      name: 'json-db-save',
      configureServer(server) {
        // Use a global middleware to be absolutely sure we catch the request
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/__save-db' && req.method === 'POST') {
            console.log('📨 [Vite Middleware] Received save request');
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                // @ts-ignore
                const fs = require('fs');
                const path = require('path');
                const filePath = path.resolve(process.cwd(), 'src/data/dummy-data.json');
                const jsonStr = JSON.stringify(JSON.parse(body), null, 2);
                fs.writeFileSync(filePath, jsonStr);

                console.log('✅ [Vite Middleware] Saved DB to src/data/dummy-data.json');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                console.error('❌ [Vite Middleware] Error saving DB:', e);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(e) }));
              }
            });
          } else {
            next();
          }
        });
      }
    },
    // authPlugin(), // Better Auth integrado - commented out due to missing file
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'La Productora',
        short_name: 'LaProductora',
        description: 'App para gestión de La Productora',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB
        runtimeCaching: [
          {
            // Cache API calls but exclude the save-db endpoint
            urlPattern: ({ url }) => url.pathname.startsWith('/api') && !url.pathname.includes('__save-db'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: parseInt(process.env.PORT || '5173'),
    strictPort: false, // Si el puerto está ocupado, Vite intentará el siguiente
    proxy: {
      '/api': {
        target: 'https://70fecc49fcf6.ngrok-free.app',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
            // Agregar header para ngrok
            proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/socket.io': {
        target: 'https://70fecc49fcf6.ngrok-free.app',
        changeOrigin: true,
        secure: true,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('socket proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('WebSocket proxy request:', req.method, req.url);
            proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('WebSocket proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
});
