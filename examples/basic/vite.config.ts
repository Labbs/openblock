import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/openblock/' : '/',
  resolve: {
    alias: {
      // Resolve @labbs/openblock packages to their source folders for live development
      '@labbs/openblock-core/styles/editor.css': path.resolve(__dirname, '../../packages/core/src/styles/editor.css'),
      '@labbs/openblock-core': path.resolve(__dirname, '../../packages/core/src'),
      '@labbs/openblock-react': path.resolve(__dirname, '../../packages/react/src'),
    },
  },
});
