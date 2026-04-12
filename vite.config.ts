import preact from '@preact/preset-vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { type Plugin, defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => {
  return {
    plugins: [
      preact(),
      tsconfigPaths(),
      VitePWA({
        manifest: false, // actual manifest served from /public
        workbox: {
          inlineWorkboxRuntime: true,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
        },
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
