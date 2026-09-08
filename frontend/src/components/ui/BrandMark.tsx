interface BrandMarkProps {
  /** Hide the wordmark when space is tight (collapsed sidebar, favicon-like usage). */
  compact?: boolean;
}

export const APP_NAME = 'Striker EVM';

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className="inline-flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-md bg-accent text-accent-ink shadow-glow"
      >
        <svg viewBox="0 0 32 32" className="size-5" fill="none">
          <path
            d="M8 22 L14 14 L18 18 L24 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className="text-base font-semibold tracking-tight text-ink">{APP_NAME}</span>
          <span className="text-xs text-ink-subtle">Valor ganado en tiempo real</span>
        </span>
      )}
    </span>
  );
}
