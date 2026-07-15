import { describe, expect, it } from 'vitest';

import type { Extraction } from '../../src/extract';
import { extractRows } from './extract-fields';

const BASE: Extraction = {
  revenueConcentration: { largestCustomerPct: null, largestCustomer: null, evidence: null },
  relatedParties: [],
  goingConcern: { substantialDoubt: false, evidence: null },
  auditor: { changed: false, auditorName: null, evidence: null },
};

describe('extractRows', () => {
  it('maps each check id onto its extraction field group', () => {
    const x: Extraction = {
      ...BASE,
      revenueConcentration: {
        largestCustomerPct: 62,
        largestCustomer: 'Pallas Automotive Group',
        evidence: 'ev',
      },
      auditor: { changed: true, auditorName: 'Crestline Audit LLP', evidence: 'ev2' },
    };
    expect(extractRows('revenue-concentration', x)?.rows).toEqual([
      ['Largest customer', 'Pallas Automotive Group'],
      ['Share of revenue', '62%'],
    ]);
    expect(extractRows('auditor-change', x)?.rows).toEqual([
      ['Auditor changed', 'yes'],
      ['Auditor', 'Crestline Audit LLP'],
    ]);
    expect(extractRows('going-concern', x)?.rows).toEqual([['Substantial doubt', 'no']]);
  });

  it('degrades quietly: empty related parties, all-null concentration, unknown check', () => {
    expect(extractRows('related-party', BASE)?.rows).toEqual([
      ['Related parties', 'none identified'],
    ]);
    expect(extractRows('revenue-concentration', BASE)?.rows).toEqual([
      ['Largest customer', 'none above disclosure threshold'],
    ]);
    expect(extractRows('a-future-check', BASE)).toBeNull();
  });

  it('lists every related party and surfaces the first evidence', () => {
    const x: Extraction = {
      ...BASE,
      relatedParties: [
        {
          counterparty: 'Vega Holdings LLC',
          relationship: 'entity controlled by the CEO',
          evidence: null,
        },
        { counterparty: 'Vega Holdings LLC', relationship: 'bridge loan', evidence: 'the loan…' },
      ],
    };
    const result = extractRows('related-party', x);
    expect(result?.rows).toHaveLength(2);
    expect(result?.evidence).toBe('the loan…');
  });
});
