import { Button } from './Button';
import { BUTTON_VARIANT } from './button-variants';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

const DEFAULT_TITLE = 'No pudimos cargar la información';
const RETRY_LABEL = 'Reintentar';

export function ErrorState({ title = DEFAULT_TITLE, message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-md border border-danger/30 bg-danger-soft p-5 text-danger"
    >
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm opacity-90">{message}</p>
      </div>
      {onRetry && (
        <Button variant={BUTTON_VARIANT.SECONDARY} onClick={onRetry}>
          {RETRY_LABEL}
        </Button>
      )}
    </div>
  );
}
