import type { CitedChunk } from '../../../src/db/search';
import type { SearchResponse } from '../api';

const PREVIEW_CHARS = 400;

interface SearchResultsProps {
  data: SearchResponse;
}

export function SearchResults({ data }: SearchResultsProps) {
  return (
    <>
      <div className="card">
        <div className="kicker">Corpus search</div>
        <div className="report-head">
          <span className="company-name">
            {data.count} result{data.count === 1 ? '' : 's'}
          </span>
          <span className="report-meta">for &ldquo;{data.query}&rdquo;</span>
        </div>
        {data.count === 0 && (
          <p className="summary">
            Nothing matched — try one of the suggested queries below the search box.
          </p>
        )}
      </div>
      {data.results.map((r) => (
        <ResultCard key={`${r.title}-${r.ordinal}`} result={r} />
      ))}
    </>
  );
}

interface ResultCardProps {
  result: CitedChunk;
}

function ResultCard({ result: r }: ResultCardProps) {
  const truncated = r.content.length > PREVIEW_CHARS;
  const clamped = Math.max(0, Math.min(1, r.score));
  return (
    <div className="card">
      <div className="result-src">
        <span className="meter" title="cosine similarity">
          <span style={{ width: `${Math.round(clamped * 100)}%` }} />
        </span>
        <span className="num">cosine {r.score.toFixed(2)}</span>
        <span>
          {r.company} · {r.sourceType} · {r.title} #{r.ordinal}
        </span>
      </div>
      <p className="result-body">
        {r.content.slice(0, PREVIEW_CHARS)}
        {truncated && '…'}
      </p>
      {truncated && (
        <details className="more">
          <summary>Show full chunk</summary>
          <p className="result-body">{r.content}</p>
        </details>
      )}
    </div>
  );
}
