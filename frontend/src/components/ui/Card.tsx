import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  /** Renders as `section` with an accessible heading when a title is given. */
  as?: 'section' | 'article' | 'div';
}

export function Card({
  eyebrow,
  title,
  description,
  action,
  children,
  as: Tag = 'section',
  className = '',
  ...rest
}: CardProps) {
  const hasHeader = title !== undefined || eyebrow !== undefined || action !== undefined;

  return (
    <Tag className={`card flex flex-col gap-5 p-6 ${className}`} {...rest}>
      {hasHeader && (
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 className="text-lg font-semibold text-ink">{title}</h2>}
            {description && <p className="text-sm text-ink-muted">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </Tag>
  );
}
