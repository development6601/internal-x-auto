import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import { copyAppResourcesPlugin } from './electron/vite-copy-resources'
import { APP_NAME } from './src/constants/app.constants'

const htmlAppTitlePlugin = () => ({
  name: 'html-app-title',
  transformIndexHtml(html: string) {
    return html.replace(/<title>.*?<\/title>/, `<title>${APP_NAME}</title>`)
  },
})

export default defineConfig({
  plugins: [
    htmlAppTitlePlugin(),
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          plugins: [copyAppResourcesPlugin()],
        },
      },
      {
        entry: 'electron/preload.ts',
        vite: {
          build: {
            rollupOptions: {
              output: {
                entryFileNames: '[name].mjs',
              },
            },
          },
        },
        onstart(args) {
          args.reload()
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
