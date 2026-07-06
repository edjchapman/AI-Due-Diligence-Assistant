import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { runReport } from '../src/agent';
import { CHECKS } from '../src/checks';
import { db, sql } from '../src/db/client';
import { chunks, documents } from '../src/db/schema';
import { embedTexts } from '../src/embeddings';

/**
 * End-to-end agent run against real pgvector: embed → store → retrieve → reason →
 * graph → report. Keyless (local providers), gated on RUN_DB_TESTS like the other
 * DB test; CI provides the pgvector service.
 */
const dbTests = process.env.RUN_DB_TESTS ? describe : describe.skip;
const COMPANY = '__agent_test__';

dbTests('runReport (agent over pgvector)', () => {
  beforeAll(async () => {
    process.env.EMBED_PROVIDER = 'local';
    process.env.LLM_PROVIDER = 'local';
    await db.delete(documents).where(eq(documents.company, COMPANY));

    const texts = [
      'The Company has substantial doubt about its ability to continue as a going concern.',
      'No single customer accounted for more than 8% of revenue; the base is diversified.',
    ];
    const embeddings = await embedTexts(texts);
    const inserted = await db
      .insert(documents)
      .values({ company: COMPANY, sourceType: '10-K', title: 'fixture' })
      .returning({ id: documents.id });
    const documentId = inserted[0]?.id;
    if (!documentId) throw new Error('failed to insert test document');
    await db.insert(chunks).values(
      embeddings.map((embedding, i) => {
        const content = texts[i];
        if (content === undefined) throw new Error('length mismatch');
        return { documentId, ordinal: i, content, embedding };
      }),
    );
  });

  afterAll(async () => {
    await db.delete(documents).where(eq(documents.company, COMPANY));
    await sql.end();
  });

  it('returns a cited finding per check with the expected verdicts', async () => {
    const report = await runReport(COMPANY);
    expect(report.findings).toHaveLength(CHECKS.length);

    const byId = new Map(report.findings.map((f) => [f.checkId, f]));
    expect(byId.get('going-concern')?.verdict).toBe('flagged');
    expect(byId.get('revenue-concentration')?.verdict).toBe('clear');
    // A flagged finding must carry its evidence.
    expect(byId.get('going-concern')?.citations.length).toBeGreaterThan(0);
    expect(byId.get('going-concern')?.citations[0]?.company).toBe(COMPANY);
  });
});
