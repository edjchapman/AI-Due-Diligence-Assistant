import type { Citation } from '../../../src/checks';

interface CitationBlockProps {
  citation: Citation;
}

export function CitationBlock({ citation: c }: CitationBlockProps) {
  return (
    <figure className="citation">
      <div className="src">
        <span>
          {c.company} · {c.sourceType} · {c.title} #{c.ordinal}
        </span>
        <span className="num">cosine {c.score.toFixed(2)}</span>
      </div>
      <blockquote className="snippet">&ldquo;{c.snippet}&rdquo;</blockquote>
    </figure>
  );
}
