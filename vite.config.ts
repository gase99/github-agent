import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const REPO_BASE_PATH = '/github-agent/';

export default defineConfig(({ command, mode }) => ({
  base: command === 'serve' ? '/' : mode === 'android' ? './' : REPO_BASE_PATH,
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
}));
