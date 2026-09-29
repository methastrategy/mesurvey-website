import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
            if (id.includes('leaflet')) return 'vendor-leaflet';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react') || id.includes('zustand')) return 'vendor-react';
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
