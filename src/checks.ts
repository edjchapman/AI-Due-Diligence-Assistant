import type { CitedChunk } from './db/search';

/** One due-diligence check: what to retrieve, and how to describe the question. */
export interface Check {
  id: string;
  label: string;
  /** Retrieval query used to pull the relevant passages for this check. */
  query: string;
  /** The yes/no question a reasoner (or heuristic) answers from the evidence. */
  question: string;
}

/** `flagged` = concern found, `clear` = evidence it does not apply, `uncertain` = inconclusive. */
export type Verdict = 'flagged' | 'clear' | 'uncertain';

/** A retrieved passage cited as evidence, trimmed for display. */
export interface Citation {
  company: string;
  sourceType: string;
  title: string;
  ordinal: number;
  score: number;
  snippet: string;
}

/** One check's outcome, always carrying the evidence it was based on. */
export interface Finding {
  checkId: string;
  label: string;
  verdict: Verdict;
  summary: string;
  citations: Citation[];
}

/** The audit-grade report for a company: a finding per check, plus provenance. */
export interface Report {
  company: string;
  generatedAt: string;
  findings: Finding[];
}

/**
 * The four M3 due-diligence checks. Each is independent — the LangGraph agent
 * runs one node per check, retrieves company-scoped evidence, and reasons a
 * verdict with citations.
 */
export const CHECKS: Check[] = [
  {
    id: 'revenue-concentration',
    label: 'Revenue concentration',
    query:
      'customer revenue concentration single largest customer percentage of net revenue dependence',
    question: 'Is a large share of revenue concentrated in one or few customers?',
  },
  {
    id: 'related-party',
    label: 'Related-party transactions',
    query:
      'related-party transaction lease loan entity controlled by a director or the CEO arm’s length',
    question: 'Are there material related-party transactions?',
  },
  {
    id: 'going-concern',
    label: 'Going concern',
    query:
      'substantial doubt about ability to continue as a going concern liquidity cash runway recurring losses',
    question: 'Is there substantial doubt about the company continuing as a going concern?',
  },
  {
    id: 'auditor-change',
    label: 'Auditor change',
    query:
      'change of auditor dismissed engaged replaced independent registered public accounting firm',
    question: 'Did the company change its independent auditor?',
  },
];

/** Build a Citation from a retrieved chunk, trimming the content for display. */
export function toCitation(chunk: CitedChunk, maxChars = 240): Citation {
  const collapsed = chunk.content.replace(/\s+/g, ' ').trim();
  return {
    company: chunk.company,
    sourceType: chunk.sourceType,
    title: chunk.title,
    ordinal: chunk.ordinal,
    score: chunk.score,
    snippet: collapsed.length > maxChars ? `${collapsed.slice(0, maxChars)}…` : collapsed,
  };
}
