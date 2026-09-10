import { ORBITAL_FIGURE_VARIANT } from './orbital-figure-variants';

import type { OrbitalFigureVariant } from './orbital-figure-variants';

/**
 * The Frecuencia Orbitacional of the Trycore identity: concentric 1px orbits with nodes on
 * them, in the light teal of the brand.
 *
 * The design system publishes it at two measures, and both are here so the mark has one
 * owner: the 420px figure of the login's brand column and the 300px one behind the reading
 * band. It orbits the content it sits behind rather than floating as loose decoration, which
 * is why it is absolutely positioned by its caller, and it is purely presentational, so it is
 * hidden from assistive technology.
 */

interface Orbit {
  radius: number;
  strokeClass: string;
  dashed: boolean;
}

interface Node {
  cx: number;
  cy: number;
  r: number;
  fillClass: string;
}

interface Geometry {
  size: number;
  center: number;
  orbits: readonly Orbit[];
  nodes: readonly Node[];
}

const DASH_PATTERN = '3 6';
const RING_WIDTH = 1;

const GEOMETRY: Record<OrbitalFigureVariant, Geometry> = {
  [ORBITAL_FIGURE_VARIANT.BRAND]: {
    size: 420,
    center: 210,
    orbits: [
      { radius: 196, strokeClass: 'stroke-accent-on-navy/18', dashed: false },
      { radius: 152, strokeClass: 'stroke-accent-on-navy/14', dashed: true },
      { radius: 108, strokeClass: 'stroke-accent-on-navy/12', dashed: false },
    ],
    nodes: [
      { cx: 406, cy: 210, r: 5, fillClass: 'fill-[var(--tc-orbit-node)]' },
      { cx: 210, cy: 58, r: 4, fillClass: 'fill-accent-on-navy' },
    ],
  },
  [ORBITAL_FIGURE_VARIANT.BAND]: {
    size: 300,
    center: 150,
    orbits: [
      { radius: 140, strokeClass: 'stroke-accent-on-navy/25', dashed: false },
      { radius: 100, strokeClass: 'stroke-accent-on-navy/[0.18]', dashed: true },
    ],
    nodes: [{ cx: 290, cy: 150, r: 4, fillClass: 'fill-[var(--tc-orbit-node)]' }],
  },
};

interface OrbitalFigureProps {
  variant?: OrbitalFigureVariant;
  className?: string;
}

export function OrbitalFigure({
  variant = ORBITAL_FIGURE_VARIANT.BRAND,
  className = '',
}: OrbitalFigureProps) {
  const { size, center, orbits, nodes } = GEOMETRY[variant];

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${size} ${size}`}
      className={`pointer-events-none ${className}`}
    >
      {orbits.map((orbit) => (
        <circle
          key={orbit.radius}
          cx={center}
          cy={center}
          r={orbit.radius}
          fill="none"
          strokeWidth={RING_WIDTH}
          strokeDasharray={orbit.dashed ? DASH_PATTERN : undefined}
          className={orbit.strokeClass}
        />
      ))}
      {nodes.map((node) => (
        <circle
          key={`${node.cx}-${node.cy}`}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          className={node.fillClass}
        />
      ))}
    </svg>
  );
}
