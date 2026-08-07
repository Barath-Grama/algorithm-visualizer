/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Algorithm suites are pure and run in node; only the hook test needs a DOM,
    // which it opts into with a `@vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // The algorithms and the pure logic around them are what the suite is
      // actually asserting; presentational components are covered by eye.
      include: ['src/algorithms/**', 'src/lib/**', 'src/hooks/**'],
    },
  },
})
