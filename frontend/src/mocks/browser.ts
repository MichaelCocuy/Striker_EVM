import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

/** Boots the Mock Service Worker; requests outside the API prefix pass through untouched. */
export async function startMockWorker(): Promise<void> {
  const worker = setupWorker(...handlers);
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
}
