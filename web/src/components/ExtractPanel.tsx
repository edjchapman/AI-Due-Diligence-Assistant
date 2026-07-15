import type { Finding } from '../../../src/checks';
import type { DocumentExtraction } from '../../../src/db/search';
import { extractRows } from '../extract-fields';

interface ExtractPanelProps {
  finding: Finding;
  extractDoc: DocumentExtraction;
}

/**
 * The structured fields the extractor read from the filing, rendered beside
 * the agent's verdict for the same check — two independent paths over the
 * same source, corroborating each other. Open by default only when flagged,
 * so the clean control company stays quiet.
 */
export function ExtractPanel({ finding, extractDoc }: ExtractPanelProps) {
  if (!extractDoc.extraction) return null;
  const fields = extractRows(finding.checkId, extractDoc.extraction);
  if (!fields) return null;

  return (
    <details className="extract" open={finding.verdict === 'flagged'}>
      <summary>Extracted fields</summary>
      <div className="extract-body">
        <dl>
          {fields.rows.map(([label, value]) => (
            <div className="extract-row" key={label + value}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {fields.evidence && <p className="evidence">&ldquo;{fields.evidence}&rdquo;</p>}
        <p className="extract-src">
          Structured extraction from {extractDoc.title} — independent of the agent&rsquo;s retrieval
          path.
        </p>
      </div>
    </details>
  );
}
