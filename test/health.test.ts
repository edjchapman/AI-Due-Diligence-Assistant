import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server';

describe('server (keyless, no DB)', () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = await buildServer({ logger: false });
  });
  afterAll(() => app.close());

  it('GET /health returns ok and is exempt from rate limiting', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', service: 'ai-due-diligence-assistant' });
    expect(res.headers['x-ratelimit-limit']).toBeUndefined();
  });

  it('serves the demo page at / with the rate limiter active', async () => {
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    // A non-exempt route carries the limiter's headers — proof it's wired.
    expect(res.headers['x-ratelimit-limit']).toBeDefined();
  });
});
