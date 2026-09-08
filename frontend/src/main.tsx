import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { env } from './config/env';

import './styles/index.css';

const ROOT_ELEMENT_ID = 'root';

async function enableMocksIfConfigured(): Promise<void> {
  if (!env.useMocks) {
    return;
  }
  const { startMockWorker } = await import('./mocks/browser');
  await startMockWorker();
}

function mountApplication(): void {
  const container = document.getElementById(ROOT_ELEMENT_ID);
  if (container === null) {
    throw new Error(`Missing #${ROOT_ELEMENT_ID} element in index.html`);
  }
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void enableMocksIfConfigured().then(mountApplication);
