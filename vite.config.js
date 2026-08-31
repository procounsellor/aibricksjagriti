import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize for production
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'i18n-vendor': ['i18next', 'react-i18next'],
        },
      },
    },
    // Increase chunk size warnings threshold for large 3D assets
    chunkSizeWarningLimit: 1000,
  },
  // SSR preparation - app is structured for SSR compatibility
  ssr: {
    noExternal: ['@react-three/fiber', '@react-three/drei'],
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'framer-motion',
      'i18next',
      'react-i18next',
    ],
  },
});
