/**
 * "Frecuencia Orbitacional" behind the reading band: two 1px rings and a node (handoff
 * §3.1). It is the 300px, two-ring variant of `components/ui/OrbitalFigure`, which the login
 * draws at 420px with three rings; a `size` and a ring list on that primitive would let the
 * two merge. Never decoration on its own — it orbits the content of the band — and purely
 * presentational, so it is hidden from assistive technology.
 */

const ORBIT = {
  VIEWBOX: '0 0 300 300',
  CENTER: 150,
  OUTER_RADIUS: 140,
  INNER_RADIUS: 100,
  INNER_DASH: '3 6',
  RING_WIDTH: 1,
  NODE_X: 290,
  NODE_RADIUS: 4,
} as const;

const ORBIT_CLASS =
  'pointer-events-none absolute -top-[90px] -right-[60px] size-[300px] opacity-35';

export function BandOrbit() {
  return (
    <svg viewBox={ORBIT.VIEWBOX} className={ORBIT_CLASS} aria-hidden="true">
      <circle
        cx={ORBIT.CENTER}
        cy={ORBIT.CENTER}
        r={ORBIT.OUTER_RADIUS}
        fill="none"
        strokeWidth={ORBIT.RING_WIDTH}
        className="stroke-accent-on-navy/25"
      />
      <circle
        cx={ORBIT.CENTER}
        cy={ORBIT.CENTER}
        r={ORBIT.INNER_RADIUS}
        fill="none"
        strokeWidth={ORBIT.RING_WIDTH}
        strokeDasharray={ORBIT.INNER_DASH}
        className="stroke-accent-on-navy/[0.18]"
      />
      <circle
        cx={ORBIT.NODE_X}
        cy={ORBIT.CENTER}
        r={ORBIT.NODE_RADIUS}
        className="fill-[var(--tc-orbit-node)]"
      />
    </svg>
  );
}
