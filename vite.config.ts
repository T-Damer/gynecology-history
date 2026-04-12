import preact from '@preact/preset-vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { type Plugin, defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => {
  return {
    plugins: [preact(), tsconfigPaths()],
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
