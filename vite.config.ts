import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// GitHub Pages にデプロイする際、リポジトリ名がパスに入るため
// 環境変数 VITE_BASE で切り替え可能にしておく
// 例) リポジトリ名が site_survey なら VITE_BASE=/site_survey/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
})
