import { setupServer } from 'msw/node';

import { handlers } from './handlers';

/** Node-side MSW server for Vitest; shares the same handlers as the browser worker. */
export const mockServer = setupServer(...handlers);
