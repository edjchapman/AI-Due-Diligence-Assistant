interface SkeletonProps {
  cards: number;
}

/** CSS-only loading placeholder; the pulse is gated on prefers-reduced-motion. */
export function Skeleton({ cards }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: cards }, (_, i) => (
        <div className="card skeleton" aria-hidden="true" key={i}>
          <div className="bar w40" />
          <div className="bar w90" />
          <div className="bar w70" />
        </div>
      ))}
    </>
  );
}
