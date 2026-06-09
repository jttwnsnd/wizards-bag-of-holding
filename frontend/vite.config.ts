import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['jt-townsend.dev', 'www.jt-townsend.dev'],
    host: '0.0.0.0',
  }
})