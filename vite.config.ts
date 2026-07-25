import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // The @react-pdf/renderer chunk is inherently large (its own PDF
    // layout/font engine) but route-level code splitting means it's only
    // fetched when an invoice route is actually visited, not on first
    // paint — so it doesn't need to warn at the default 500kB threshold.
    chunkSizeWarningLimit: 1600,
  },
})
