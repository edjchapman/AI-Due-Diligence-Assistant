const PIPELINE = [
  'filings + minutes',
  'chunk + embed (pgvector)',
  'LangGraph agent',
  'cited report',
  'eval gate in CI',
];

export function Masthead() {
  return (
    <>
      <header className="masthead">
        <div>
          <h1>AI Due Diligence Assistant</h1>
          <p className="sub">
            Reads a company&rsquo;s filings and board minutes, runs four due-diligence checks, and
            cites the exact source behind every verdict.
          </p>
        </div>
        <span className="pill" title="No API key needed — deterministic local providers">
          keyless demo mode
        </span>
      </header>
      <p className="pipeline" aria-label="Pipeline">
        {PIPELINE.map((stage, i) => (
          <span key={stage}>
            {i > 0 && <span className="arrow">→</span>}
            <span className="stage">{stage}</span>
          </span>
        ))}
      </p>
    </>
  );
}
