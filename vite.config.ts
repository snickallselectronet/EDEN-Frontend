import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Optimize Fast Refresh - prevent unnecessary reloads
      exclude: /node_modules/,
    })
  ],
  
  base: '/portal/',  // Set base path to /portal/
  
  // ========================================
  // BUILD OPTIMIZATION
  // ========================================
  build: {
    outDir: 'dist/portal',  // Output directory to dist/portal
    emptyOutDir: true,      // Clean the output directory before each build
    
    // Source maps (disable in production for smaller bundles)
    sourcemap: false,
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and to prevent duplicate loads
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Auth
          'auth-vendor': ['@auth0/auth0-react'],
          
          // PDF rendering (heavy library - split it out)
          'pdf-vendor': ['@react-pdf/renderer'],
          
          // Chart.js
          'chart-vendor': ['chart.js'],
          
          // Bootstrap
          'bootstrap-vendor': ['react-bootstrap'],
        },
        
        // Asset file naming - keep fonts stable with consistent hashing
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          // Keep font files in a separate fonts directory
          if (name.endsWith('.ttf') || 
              name.endsWith('.otf') ||
              name.endsWith('.woff') ||
              name.endsWith('.woff2')) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // Asset inlining strategy
    // Set to 0 to prevent inlining fonts (they should be separate cached files)
    assetsInlineLimit: 0,  // Don't inline any assets - serve them separately for better caching
  },
  
  // ========================================
  // DEV SERVER CONFIGURATION
  // ========================================
  server: {
    port: 58080,
    host: '0.0.0.0',
    
    // Enable file system caching
    fs: {
      strict: false,
      allow: ['..'],
    },
    
    // HMR configuration to reduce unnecessary updates
    hmr: {
      overlay: true,
    },
    
    // Warmup frequently used files for faster initial load
    warmup: {
      clientFiles: [
        './src/App.tsx',
        './src/main.tsx',
        './src/components/**/*.tsx',
      ],
    },
    
    // No proxy needed - API calls go directly to backend endpoints
    proxy: {}
  },
  
  // ========================================
  // PREVIEW SERVER
  // ========================================
  preview: {
    port: 58080,
    host: '0.0.0.0',
    // No proxy needed - API calls go directly to backend endpoints
    proxy: {}
  },
  
  // ========================================
  // RESOLVE ALIASES
  // ========================================
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
      { find: '@utilities', replacement: path.resolve(__dirname, 'src/utilities') },
    ],
  },
  
  // ========================================
  // DEPENDENCY OPTIMIZATION
  // ========================================
  optimizeDeps: {
    // Pre-bundle these dependencies to speed up dev server
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@auth0/auth0-react',
      '@react-pdf/renderer',
      'html2canvas',
      'chart.js',
      'react-bootstrap',
    ],
    
    // Force re-optimization on server start (useful during dev)
    force: false,
  },
  
  // ========================================
  // CACHING
  // ========================================
  cacheDir: 'node_modules/.vite',
})