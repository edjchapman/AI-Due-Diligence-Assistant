import { and, cosineDistance, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from './client';
import { chunks, documents } from './schema';

/** A retrieved chunk with the citation fields needed for an audit-grade report. */
export interface CitedChunk {
  content: string;
  ordinal: number;
  company: string;
  sourceType: string;
  title: string;
  /** Cosine similarity in [0, 1]; higher is closer. */
  score: number;
}

export interface SearchOptions {
  /** Restrict retrieval to one company's documents (exact match on `documents.company`). */
  company?: string;
}

/** Distinct company names present in the corpus (for resolving `/report/:company`). */
export async function listCompanies(): Promise<string[]> {
  const rows = await db.selectDistinct({ company: documents.company }).from(documents);
  return rows.map((r) => r.company);
}

/**
 * Cosine top-k over the chunk embeddings, joined to their source document for
 * citation. Pure DB — takes a query *vector*, not text, so it can be tested
 * without calling an embedding provider. The order-by uses `cosineDistance`
 * (`<=>`), which matches the `vector_cosine_ops` HNSW index on `chunks.embedding`.
 * Pass `opts.company` to scope retrieval to a single company (the M3 report path).
 */
export async function searchByVector(
  embedding: number[],
  k = 5,
  opts: SearchOptions = {},
): Promise<CitedChunk[]> {
  const similarity = sql<number>`1 - (${cosineDistance(chunks.embedding, embedding)})`;
  const filter = opts.company
    ? and(isNotNull(chunks.embedding), eq(documents.company, opts.company))
    : isNotNull(chunks.embedding);
  return db
    .select({
      content: chunks.content,
      ordinal: chunks.ordinal,
      company: documents.company,
      sourceType: documents.sourceType,
      title: documents.title,
      score: similarity,
    })
    .from(chunks)
    .innerJoin(documents, eq(chunks.documentId, documents.id))
    .where(filter)
    .orderBy(desc(similarity))
    .limit(k);
}
