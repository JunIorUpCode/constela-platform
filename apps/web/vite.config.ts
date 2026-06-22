import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@constela/db': path.resolve(__dirname, '../../packages/db/src'),
      '@constela/types': path.resolve(__dirname, '../../packages/types/src'),
      '@constela/validators': path.resolve(__dirname, '../../packages/validators/src'),
      '@constela/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
});
