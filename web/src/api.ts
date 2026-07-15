// Typed client for the Fastify API. The response types are imported from the
// *server source* (type-only, erased at build) — one definition of Report,
// Citation, and Extraction across the whole stack, so a server-side shape
// change fails the frontend typecheck instead of breaking at runtime.
import type { Report } from '../../src/checks';
import type { CitedChunk, DocumentExtraction } from '../../src/db/search';

export interface CompaniesResponse {
  companies: string[];
}

export interface SearchResponse {
  query: string;
  count: number;
  results: CitedChunk[];
}

export interface ExtractResponse {
  company: string;
  documents: DocumentExtraction[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    const message =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : res.statusText;
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  companies: () => getJson<CompaniesResponse>('/companies'),
  report: (company: string) => getJson<Report>(`/report/${encodeURIComponent(company)}`),
  extract: (company: string) => getJson<ExtractResponse>(`/extract/${encodeURIComponent(company)}`),
  search: (query: string) => getJson<SearchResponse>(`/search?q=${encodeURIComponent(query)}`),
};

/**
 * The document whose extraction backs the per-check panels. Prefer the
 * filing-summary PDF — it carries the fullest structured fields; any other
 * extracted document is a fallback, never a blocker.
 */
export function pickExtractDoc(documents: DocumentExtraction[]): DocumentExtraction | undefined {
  return (
    documents.find((d) => d.sourceType === 'filing-summary' && d.extraction) ??
    documents.find((d) => d.extraction)
  );
}
