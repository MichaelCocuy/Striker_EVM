import { Button } from './Button';
import { BUTTON_VARIANT } from './button-variants';
import { ICON_SIZE, ICON_STROKE, TriangleAlert } from './icons';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

const DEFAULT_TITLE = 'No pudimos cargar la información';
const RETRY_LABEL = 'Reintentar';

/** The handoff's error block: soft red field, the alert icon, and the retry that refetches. */
export function ErrorState({ title = DEFAULT_TITLE, message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-md bg-danger-soft px-4 py-[14px] text-danger"
    >
      <TriangleAlert
        aria-hidden="true"
        size={ICON_SIZE.CONTENT}
        strokeWidth={ICON_STROKE.ALERT}
        className="mt-0.5 shrink-0"
      />
      <div className="flex min-w-0 flex-col items-start gap-2">
        <p className="font-heading font-semibold">{title}</p>
        <p className="text-small">{message}</p>
        {onRetry && (
          <Button variant={BUTTON_VARIANT.TERTIARY} onClick={onRetry} className="mt-1">
            {RETRY_LABEL}
          </Button>
        )}
      </div>
    </div>
  );
}
