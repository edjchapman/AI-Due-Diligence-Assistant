import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // web component tests opt into jsdom per-file via `// @vitest-environment jsdom`.
    include: ['test/**/*.test.ts', 'web/src/**/*.test.{ts,tsx}'],
  },
});
