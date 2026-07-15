import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The React demo lives in web/ and builds into public/, which Fastify already
// serves at / — the server needs no knowledge of the frontend toolchain.
// `npm run dev:web` proxies the API paths to the Fastify dev server so both
// hot-reload (5173) and the served build (3000) hit the same backend.
export default defineConfig({
  root: 'web',
  plugins: [react()],
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    proxy: Object.fromEntries(
      ['/companies', '/search', '/report', '/extract', '/health'].map((path) => [
        path,
        'http://localhost:3000',
      ]),
    ),
  },
});
