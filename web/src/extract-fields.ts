import type { Extraction } from '../../src/extract';

export interface ExtractRows {
  rows: readonly [label: string, value: string][];
  evidence: string | null;
}

/**
 * Map a check to the matching field group of the /extract payload (they map
 * 1:1 by design — see src/extract.ts). Returns null for unknown check ids so
 * a new server-side check degrades to "no panel", never a crash.
 */
export function extractRows(checkId: string, x: Extraction): ExtractRows | null {
  switch (checkId) {
    case 'revenue-concentration':
      return revenueRows(x);
    case 'related-party':
      return relatedPartyRows(x);
    case 'going-concern':
      return {
        rows: [['Substantial doubt', x.goingConcern.substantialDoubt ? 'yes' : 'no']],
        evidence: x.goingConcern.evidence,
      };
    case 'auditor-change':
      return {
        rows: [
          ['Auditor changed', x.auditor.changed ? 'yes' : 'no'],
          ['Auditor', x.auditor.auditorName ?? '—'],
        ],
        evidence: x.auditor.evidence,
      };
    default:
      return null;
  }
}

function revenueRows(x: Extraction): ExtractRows {
  const rc = x.revenueConcentration;
  if (rc.largestCustomer === null && rc.largestCustomerPct === null) {
    return {
      rows: [['Largest customer', 'none above disclosure threshold']],
      evidence: rc.evidence,
    };
  }
  return {
    rows: [
      ['Largest customer', rc.largestCustomer ?? '—'],
      ['Share of revenue', rc.largestCustomerPct !== null ? `${rc.largestCustomerPct}%` : '—'],
    ],
    evidence: rc.evidence,
  };
}

function relatedPartyRows(x: Extraction): ExtractRows {
  if (x.relatedParties.length === 0) {
    return { rows: [['Related parties', 'none identified']], evidence: null };
  }
  return {
    rows: x.relatedParties.map((p) => [p.counterparty, p.relationship] as const),
    evidence: x.relatedParties.find((p) => p.evidence)?.evidence ?? null,
  };
}
