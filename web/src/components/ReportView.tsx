import type { Report } from '../../../src/checks';
import type { DocumentExtraction } from '../../../src/db/search';
import { FindingCard } from './FindingCard';
import { VerdictIcon } from './VerdictIcon';

interface ReportViewProps {
  report: Report;
  extractDoc?: DocumentExtraction;
}

export function ReportView({ report, extractDoc }: ReportViewProps) {
  const flags = report.findings.filter((f) => f.verdict === 'flagged').length;
  return (
    <>
      <div className="card">
        <div className="kicker">Due-diligence report</div>
        <div className="report-head">
          <span className="company-name">{report.company}</span>
          <span className="report-meta">
            {flags} flag{flags === 1 ? '' : 's'} · {report.findings.length} checks ·{' '}
            <time dateTime={report.generatedAt}>{formatTime(report.generatedAt)}</time>
          </span>
        </div>
        <nav className="verdict-strip" aria-label="Verdicts">
          {report.findings.map((f) => (
            <a key={f.checkId} href={`#check-${f.checkId}`}>
              <span className={`dot ${f.verdict}`}>
                <VerdictIcon verdict={f.verdict} />
              </span>
              {f.label}
            </a>
          ))}
        </nav>
      </div>
      {report.findings.map((f) => (
        <FindingCard key={f.checkId} finding={f} extractDoc={extractDoc} />
      ))}
    </>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}
