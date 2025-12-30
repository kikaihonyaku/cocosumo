import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM testing
    environment: 'jsdom',
    // Global test APIs
    globals: true,
    // Setup files
    setupFiles: ['./app/frontend/test/setup.js'],
    // Include patterns
    include: ['app/frontend/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/frontend/**/*.{js,jsx}'],
      exclude: [
        'app/frontend/test/**',
        'app/frontend/**/*.test.{js,jsx}',
        'app/frontend/**/*.spec.{js,jsx}'
      ]
    },
    // CSS handling
    css: true,
    // Reporter
    reporters: ['verbose'],
    // Timeout
    testTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './app/frontend')
    }
  }
});
