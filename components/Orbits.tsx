/**
 * The fine concentric arcs and node points printed behind the skeleton on the cover,
 * redrawn as a quiet structural motif for the page.
 */
export function Orbits({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 800 800" fill="none" aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
        <circle cx="400" cy="400" r="398" opacity="0.5" />
        <circle cx="400" cy="400" r="300" opacity="0.7" />
        <circle cx="400" cy="400" r="210" opacity="0.4" />
        <path d="M 40 560 A 380 380 0 0 1 560 40" opacity="0.8" />
      </g>
      <g fill="currentColor">
        <circle cx="117" cy="683" r="3.5" />
        <circle cx="700" cy="400" r="3" />
        <circle cx="400" cy="100" r="2.5" />
        <circle cx="251" cy="225" r="2.5" />
        <circle cx="610" cy="550" r="2" />
      </g>
    </svg>
  );
}
