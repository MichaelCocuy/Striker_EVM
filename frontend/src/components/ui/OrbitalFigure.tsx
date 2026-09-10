/**
 * The Frecuencia Orbitacional of the Trycore identity: three concentric 1px orbits and two
 * nodes on them, in the light teal of the brand.
 *
 * It orbits the content it sits behind — the login's brand column — rather than floating as
 * loose decoration, which is why it is absolutely positioned by its caller.
 */

interface OrbitalFigureProps {
  className?: string;
}

const FIGURE = {
  SIZE: 420,
  CENTER: 210,
  DASH_PATTERN: '3 6',
} as const;

const ORBITS = [
  { radius: 196, strokeClass: 'stroke-accent-on-navy/18', dashed: false },
  { radius: 152, strokeClass: 'stroke-accent-on-navy/14', dashed: true },
  { radius: 108, strokeClass: 'stroke-accent-on-navy/12', dashed: false },
] as const;

const NODES = [
  { cx: 406, cy: 210, r: 5, fillClass: 'fill-[var(--tc-orbit-node)]' },
  { cx: 210, cy: 58, r: 4, fillClass: 'fill-accent-on-navy' },
] as const;

export function OrbitalFigure({ className = '' }: OrbitalFigureProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${FIGURE.SIZE} ${FIGURE.SIZE}`}
      className={`pointer-events-none ${className}`}
    >
      {ORBITS.map((orbit) => (
        <circle
          key={orbit.radius}
          cx={FIGURE.CENTER}
          cy={FIGURE.CENTER}
          r={orbit.radius}
          fill="none"
          strokeWidth="1"
          strokeDasharray={orbit.dashed ? FIGURE.DASH_PATTERN : undefined}
          className={orbit.strokeClass}
        />
      ))}
      {NODES.map((node) => (
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
