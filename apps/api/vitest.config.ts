import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    root: fileURLToPath(new URL('./', import.meta.url)),
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
