import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'manifest.json',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'data/presets.geojson'],
      manifest: {
        name: 'MESURV — Geomatics & Survey Engineering Platform',
        short_name: 'MESURV',
        description: 'แพลตฟอร์มวิศวกรรมสำรวจ คำนวณรังวัด และแผนที่ภูมิสารสนเทศ',
        lang: 'th',
        theme_color: '#f7f5f2',
        background_color: '#f7f5f2',
        display: 'standalone',
        orientation: 'any',
        start_url: './#/knowledge',
        scope: './',
        categories: ['utilities', 'education', 'engineering', 'productivity'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // Google Fonts Stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Google Fonts Webfonts
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Leaflet CDN Stylesheets & Scripts
          {
            urlPattern: /^https:\/\/unpkg\.com\/leaflet.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'leaflet-cdn-cache',
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Map Tiles (OpenStreetMap, Esri World Imagery, OpenTopoMap, Carto, RainViewer, NASA GIBS)
          {
            urlPattern: /^https:\/\/(?:[a-c]\.)?tile(?:cache)?\.(?:openstreetmap|opentopomap|rainviewer)\.org|^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery|^https:\/\/a\.basemaps\.cartocdn\.com|^https:\/\/gibs\.earthdata\.nasa\.gov/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mesurv-map-tiles-cache',
              expiration: {
                maxEntries: 400,
                maxAgeSeconds: 14 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Telemetry and Weather/Dam/Earthquake APIs
          {
            urlPattern: /\/api\/rid-dams|earthquake\.usgs\.gov|open-meteo\.com|rainviewer\.com\/api/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mesurv-telemetry-cache',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Heavy background frames webp (cached on demand rather than full upfront precache)
          {
            urlPattern: /\/bg-frames\/.*\.webp$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mesurv-bg-frames-cache',
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api/rid-dams': {
        target: 'https://app.rid.go.th',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rid-dams/, '/reservoir/api/dam/public'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('leaflet') || id.includes('proj4')) return 'vendor-leaflet';
            if (id.includes('maplibre-gl')) return 'vendor-maplibre';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react') || id.includes('zustand') || id.includes('clsx') || id.includes('tailwind-merge')) return 'vendor-react';
          }
          if (id.includes('src/data/knowledge-topics')) {
            return 'data-knowledge';
          }
          if (id.includes('src/data/thailand-hydro-network')) {
            return 'data-hydro';
          }
        },
      },
    },
  },
});
