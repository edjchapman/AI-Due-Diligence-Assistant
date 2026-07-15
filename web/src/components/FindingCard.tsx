import type { Finding } from '../../../src/checks';
import type { DocumentExtraction } from '../../../src/db/search';
import { CitationBlock } from './CitationBlock';
import { ExtractPanel } from './ExtractPanel';
import { VerdictBadge } from './VerdictBadge';

interface FindingCardProps {
  finding: Finding;
  extractDoc?: DocumentExtraction;
}

export function FindingCard({ finding, extractDoc }: FindingCardProps) {
  return (
    <article className="card" id={`check-${finding.checkId}`}>
      <div className="check-head">
        <VerdictBadge verdict={finding.verdict} />
        <span className="check-label">{finding.label}</span>
      </div>
      <p className="summary">{finding.summary}</p>
      {finding.citations.map((c) => (
        <CitationBlock key={`${c.title}-${c.ordinal}`} citation={c} />
      ))}
      {extractDoc && <ExtractPanel finding={finding} extractDoc={extractDoc} />}
    </article>
  );
}
