import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/esp32': {
        target: 'http://192.168.1.79',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/esp32/, ''),
      }
    }
  }
})