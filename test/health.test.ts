import { afterAll, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server';

describe('GET /health', () => {
  const app = buildServer({ logger: false });
  afterAll(() => app.close());

  it('returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', service: 'ai-due-diligence-assistant' });
  });
});
