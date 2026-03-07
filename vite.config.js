import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Le enseñamos a Vite a usar el arroba (@)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})