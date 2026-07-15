import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/server.js';

/**
 * Pins the demo page's contract with the API and its self-contained constraint.
 * The page is vanilla HTML/CSS/JS with no build step, so these string assertions
 * are the whole UI test surface — no browser or DOM library needed.
 */
describe('demo page contract', () => {
  async function page(): Promise<string> {
    const app = await buildServer({ logger: false });
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    await app.close();
    return res.body;
  }

  it('exposes the element hooks the inline script relies on', async () => {
    const html = await page();
    for (const id of ['companies', 'q', 'searchBtn', 'out', 'search-form']) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it('calls every public API surface, including structured extraction', async () => {
    const html = await page();
    expect(html).toContain('/companies');
    expect(html).toContain('/report/');
    expect(html).toContain('/search?q=');
    expect(html).toContain('/extract/');
  });

  it('loads no external resources (self-contained, works offline behind the rate limit)', async () => {
    const html = await page();
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toMatch(/<link[^>]+href="http/);
    expect(html).not.toContain('@import');
    expect(html).not.toContain('url(http');
    expect(html).not.toMatch(/fetch\(\s*['"]http/);
  });

  it('declares language and both color schemes', async () => {
    const html = await page();
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('name="color-scheme"');
    expect(html).toContain('prefers-color-scheme: dark');
  });
});
