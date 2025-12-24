import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Familias/', // Adicione exatamente o nome do seu repositório aqui entre barras
})