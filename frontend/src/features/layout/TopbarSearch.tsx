import { useId, useState } from 'react';

import { ICON_SIZE, ICON_STROKE, Search } from '@/components/ui/icons';

import type { ChangeEvent } from 'react';

const COPY = {
  LABEL: 'Buscar en Striker EVM',
  PLACEHOLDER: 'Buscar…',
} as const;

/**
 * The elastic element of the topbar.
 *
 * `flex-[1_1_0]` with `min-w-0` on both the box and the input is what absorbs every width the
 * shell is given: the box shrinks to nothing before any fixed control has to, so the topbar
 * can never overflow. It caps at the 220px the handoff draws.
 *
 * The field keeps its own text. `docs/api/openapi.yaml` exposes no search endpoint yet, so
 * there is nothing to query with it; the slot exists because the layout depends on it.
 */
export function TopbarSearch() {
  const [query, setQuery] = useState('');
  const inputId = useId();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  return (
    <div className="flex max-w-[220px] min-w-0 flex-[1_1_0] items-center gap-2 overflow-hidden rounded-md border border-line bg-surface px-3 py-[7px] transition-[border-color,box-shadow] duration-150 focus-within:border-accent-bright focus-within:shadow-focus">
      <Search
        aria-hidden="true"
        size={ICON_SIZE.SIDEBAR}
        strokeWidth={ICON_STROKE.UI}
        className="shrink-0 text-ink-subtle"
      />
      <label htmlFor={inputId} className="sr-only">
        {COPY.LABEL}
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={handleChange}
        placeholder={COPY.PLACEHOLDER}
        className="w-full min-w-0 border-0 bg-transparent text-small text-ink-body outline-none placeholder:text-ink-subtle"
      />
    </div>
  );
}
