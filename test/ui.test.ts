import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/server.js';

/**
 * Pins the served frontend to the API and to the self-hosted constraint.
 * The demo is a React app built by Vite into public/ (the `pretest` script
 * builds it before every test run), so these assertions run against the real
 * production artifact: the served shell, its hashed assets, and the bundle's
 * API surface.
 */
describe('demo frontend contract', () => {
  async function fetchPath(path: string): Promise<{ status: number; body: string }> {
    const app = await buildServer({ logger: false });
    const res = await app.inject({ method: 'GET', url: path });
    await app.close();
    return { status: res.statusCode, body: res.body };
  }

  function assetPaths(shell: string): string[] {
    return [...shell.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1] ?? '');
  }

  it('serves the built React shell at /', async () => {
    const { status, body } = await fetchPath('/');
    expect(status).toBe(200);
    expect(body).toContain('<html lang="en">');
    expect(body).toContain('name="color-scheme"');
    expect(body).toContain('id="root"');
  });

  it('every referenced asset resolves, and none is external', async () => {
    const { body: shell } = await fetchPath('/');
    const assets = assetPaths(shell);
    expect(assets.length).toBeGreaterThanOrEqual(2); // js + css
    for (const path of assets) {
      const { status } = await fetchPath(path);
      expect(status, path).toBe(200);
    }
    // the shell must not load anything from another origin
    expect(shell).not.toMatch(/<script[^>]+src="http/);
    expect(shell).not.toMatch(/<link[^>]+href="http/);
  });

  it('the bundle calls every public API surface, including structured extraction', async () => {
    const { body: shell } = await fetchPath('/');
    const jsPath = assetPaths(shell).find((p) => p.endsWith('.js'));
    expect(jsPath).toBeDefined();
    const { body: bundle } = await fetchPath(jsPath ?? '');
    for (const surface of ['/companies', '/report/', '/search?q=', '/extract/']) {
      expect(bundle).toContain(surface);
    }
  });

  it('styles keep the light/dark contract and stay self-contained', async () => {
    const { body: shell } = await fetchPath('/');
    const cssPath = assetPaths(shell).find((p) => p.endsWith('.css'));
    expect(cssPath).toBeDefined();
    const { body: css } = await fetchPath(cssPath ?? '');
    expect(css).toContain('prefers-color-scheme:dark');
    expect(css).not.toContain('@import');
    expect(css).not.toContain('url(http');
  });
});
