import { useEffect, useRef, useState } from 'react';

import { api, pickExtractDoc, type SearchResponse } from './api';
import type { Report } from '../../src/checks';
import type { DocumentExtraction } from '../../src/db/search';
import { CompanyPicker } from './components/CompanyPicker';
import { ErrorCard } from './components/ErrorCard';
import { Masthead } from './components/Masthead';
import { ReportView } from './components/ReportView';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { Skeleton } from './components/Skeleton';
import { VerdictIcon } from './components/VerdictIcon';

type View =
  | { kind: 'idle' }
  | { kind: 'loading'; cards: number }
  | { kind: 'report'; report: Report; extractDoc?: DocumentExtraction }
  | { kind: 'search'; data: SearchResponse }
  | { kind: 'error'; error: unknown; verb: string };

export function App() {
  const [companies, setCompanies] = useState<string[] | 'loading' | 'error'>('loading');
  const [view, setView] = useState<View>({ kind: 'idle' });
  // Monotonic request id: a slow earlier response must never overwrite a later one.
  const requestId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    api
      .companies()
      .then((r) => {
        if (!cancelled) setCompanies(r.companies);
      })
      .catch(() => {
        if (!cancelled) setCompanies('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const begin = (cards: number): number => {
    setView({ kind: 'loading', cards });
    return ++requestId.current;
  };

  const runReport = async (company: string) => {
    const id = begin(3);
    // The extraction panel is progressive enhancement — a failed /extract
    // never blocks the report.
    const [report, extract] = await Promise.allSettled([api.report(company), api.extract(company)]);
    if (id !== requestId.current) return;
    if (report.status === 'rejected') {
      setView({ kind: 'error', error: report.reason, verb: 'run the report' });
      return;
    }
    const extractDoc =
      extract.status === 'fulfilled' ? pickExtractDoc(extract.value.documents) : undefined;
    setView({ kind: 'report', report: report.value, extractDoc });
  };

  const runSearch = async (query: string) => {
    const id = begin(2);
    try {
      const data = await api.search(query);
      if (id === requestId.current) setView({ kind: 'search', data });
    } catch (error) {
      if (id === requestId.current) setView({ kind: 'error', error, verb: 'search' });
    }
  };

  return (
    <main>
      <Masthead />

      <section className="section" aria-labelledby="report-h">
        <div className="step">
          <span className="n" aria-hidden="true">
            1
          </span>
          <h2 id="report-h">Run a due-diligence report</h2>
        </div>
        <p className="hint">
          Pick a company — a stateful LangGraph agent runs four checks (revenue concentration ·
          related-party · going concern · auditor change), each returning a cited verdict
          corroborated by structured extraction from the filing PDF.
        </p>
        <CompanyPicker companies={companies} onPick={(c) => void runReport(c)} />
        <div className="legend">
          <span className="flagged">
            <span className="key">
              <VerdictIcon verdict="flagged" /> flagged
            </span>{' '}
            concern found
          </span>
          <span className="clear">
            <span className="key">
              <VerdictIcon verdict="clear" /> clear
            </span>{' '}
            evidence it doesn&rsquo;t apply
          </span>
          <span className="uncertain">
            <span className="key">
              <VerdictIcon verdict="uncertain" /> uncertain
            </span>{' '}
            inconclusive
          </span>
        </div>
      </section>

      <section className="section" aria-labelledby="search-h">
        <div className="step">
          <span className="n" aria-hidden="true">
            2
          </span>
          <h2 id="search-h">Or search the source corpus</h2>
        </div>
        <p className="hint">
          Semantic (vector) retrieval over the raw document chunks — the layer the agent reads from.
          Every hit carries its citation.
        </p>
        <SearchBar onSearch={(q) => void runSearch(q)} />
      </section>

      <div id="out" aria-live="polite" aria-busy={view.kind === 'loading'}>
        {view.kind === 'loading' && <Skeleton cards={view.cards} />}
        {view.kind === 'report' && <ReportView report={view.report} extractDoc={view.extractDoc} />}
        {view.kind === 'search' && <SearchResults data={view.data} />}
        {view.kind === 'error' && <ErrorCard error={view.error} verb={view.verb} />}
      </div>

      <footer className="note">
        Public demo runs in keyless deterministic mode (local embedder + heuristic reasoner). The
        real path uses OpenAI embeddings + Claude, and every build is gated by a golden-set eval in
        CI — see the{' '}
        <a href="https://github.com/edjchapman/ai-due-diligence-assistant">repository</a>.
      </footer>
    </main>
  );
}
