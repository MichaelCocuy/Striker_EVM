import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  /** Renders as `section` with an accessible heading when a title is given. */
  as?: 'section' | 'article' | 'div';
  /** A card the reader can act on: it rests one plane lower and rises 1px on hover. */
  interactive?: boolean;
}

const BASE_CLASSES = 'card flex flex-col gap-[14px] p-[18px]';
const INTERACTIVE_CLASSES =
  'shadow-low transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-card';

export function Card({
  eyebrow,
  title,
  description,
  action,
  children,
  as: Tag = 'section',
  interactive = false,
  className = '',
  ...rest
}: CardProps) {
  const hasHeader = title !== undefined || eyebrow !== undefined || action !== undefined;

  return (
    <Tag
      className={`${BASE_CLASSES} ${interactive ? INTERACTIVE_CLASSES : ''} ${className}`}
      {...rest}
    >
      {hasHeader && (
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h3 className="text-h3 font-semibold text-ink">{title}</h3>}
            {description && (
              <p className="text-small leading-normal text-ink-body">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </Tag>
  );
}
