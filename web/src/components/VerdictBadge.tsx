import type { Verdict } from '../../../src/checks';
import { VerdictIcon } from './VerdictIcon';

interface VerdictBadgeProps {
  verdict: Verdict;
}

/** Pill badge: icon + the verdict word, so the state never relies on color alone. */
export function VerdictBadge({ verdict }: VerdictBadgeProps) {
  return (
    <span className={`badge ${verdict}`}>
      <VerdictIcon verdict={verdict} />
      {verdict}
    </span>
  );
}
