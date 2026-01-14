import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/openblock/' : '/',
  resolve: {
    alias: {
      // Resolve @openblock packages to their dist folders in the monorepo
      '@openblock/core/styles/editor.css': path.resolve(__dirname, '../../packages/core/dist/styles/editor.css'),
      '@openblock/core': path.resolve(__dirname, '../../packages/core/dist'),
      '@openblock/react': path.resolve(__dirname, '../../packages/react/dist'),
    },
  },
});
