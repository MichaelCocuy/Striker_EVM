import { BAND_INK } from './band-tokens';

/**
 * "Frecuencia Orbitacional": the brand geometry that sits behind the reading band
 * (handoff §3.1). Two 1px rings and a node — never decoration on its own, it orbits the
 * content of the band. Purely presentational, so it is hidden from assistive technology.
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
        stroke={BAND_INK.ORBIT_OUTER}
        strokeWidth={ORBIT.RING_WIDTH}
      />
      <circle
        cx={ORBIT.CENTER}
        cy={ORBIT.CENTER}
        r={ORBIT.INNER_RADIUS}
        fill="none"
        stroke={BAND_INK.ORBIT_INNER}
        strokeWidth={ORBIT.RING_WIDTH}
        strokeDasharray={ORBIT.INNER_DASH}
      />
      <circle
        cx={ORBIT.NODE_X}
        cy={ORBIT.CENTER}
        r={ORBIT.NODE_RADIUS}
        fill={BAND_INK.ORBIT_NODE}
      />
    </svg>
  );
}
