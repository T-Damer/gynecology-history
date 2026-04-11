import { defineConfig, Plugin } from 'vite'
import preact from '@preact/preset-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(() => {
  return {
    plugins: [
      preact(),
      tsconfigPaths(),
      VitePWA({
        manifest: false, // actually fetches manifest.json from /public
      }),
    ],
    build: {
      rollupOptions: {
        plugins: [
          visualizer({
            gzipSize: true,
            brotliSize: true,
          }) as Plugin,
        ],
      },
      outDir: 'dist',
    },
    base: '/gynecology-history/',
  }
})
