import type { Verdict } from '../../../src/checks';

interface VerdictIconProps {
  verdict: Verdict;
}

const PATHS: Record<Verdict, string> = {
  // flag on a pole / check mark / horizontal dash
  flagged: 'M3.5 1.5v13M3.5 2.5h8l-2 3 2 3h-8',
  clear: 'M2.5 8.5l3.5 3.5 7-8',
  uncertain: 'M3 8h10',
};

/** Crisp geometric glyph for a verdict — always paired with the verdict word. */
export function VerdictIcon({ verdict }: VerdictIconProps) {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
      <path
        d={PATHS[verdict]}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
