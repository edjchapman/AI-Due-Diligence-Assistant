import { runReport } from './agent';
import type { Finding, Verdict } from './checks';
import { sql } from './db/client';
import { listCompanies } from './db/search';

/**
 * Milestone demo (M3): run the due-diligence agent over every ingested company
 * and print a readable, cited audit report — flagged vs clear across the corpus.
 * Run via `make demo` (keyless: EMBED_PROVIDER=local, LLM_PROVIDER=local). The
 * same data flows through `GET /report/:company` as structured JSON.
 */
const MARK: Record<Verdict, string> = { flagged: '⚑', clear: '✓', uncertain: '?' };

function renderFinding(finding: Finding): void {
  console.log(
    `    ${MARK[finding.verdict]} ${finding.label.padEnd(26)} ` +
      `${finding.verdict.toUpperCase().padEnd(9)} ${finding.summary}`,
  );
  // Show the evidence for anything flagged — that's the audit-grade citation.
  const top = finding.citations[0];
  if (finding.verdict === 'flagged' && top) {
    const snippet = top.snippet.length > 108 ? `${top.snippet.slice(0, 108)}…` : top.snippet;
    console.log(`        ↳ ${top.company} · ${top.sourceType} #${top.ordinal}  “${snippet}”`);
  }
}

async function main(): Promise<void> {
  const reasoning =
    process.env.LLM_PROVIDER === 'local'
      ? 'local heuristic (keyless)'
      : 'anthropic · claude-sonnet-4-6';
  console.log(`\n  AI Due Diligence — audit report demo   [reasoning: ${reasoning}]`);
  if (process.env.LLM_PROVIDER === 'local') {
    console.log(
      '  (heuristic stand-in — set ANTHROPIC_API_KEY and LLM_PROVIDER=anthropic for the model)',
    );
  }
  console.log('');

  const companies = (await listCompanies()).sort();
  if (companies.length === 0) {
    console.log('  (no data — run `make demo`, or `npm run ingest` first)\n');
    return;
  }

  for (const company of companies) {
    const report = await runReport(company);
    const flags = report.findings.filter((f) => f.verdict === 'flagged').length;
    console.log(`  ═══ ${company} ═══   (${flags} flag${flags === 1 ? '' : 's'})`);
    for (const finding of report.findings) renderFinding(finding);
    console.log('');
  }
}

try {
  await main();
} finally {
  await sql.end();
}
