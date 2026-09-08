import { HTTP_METHOD } from '@/constants/http';

import { apiClient } from './client';

import type { ApiClient } from './client';
import type {
  Activity,
  ActivityInput,
  EvmReport,
  HealthResponse,
  LoginRequest,
  LoginResponse,
  Project,
  ProjectInput,
  User,
} from './types';

export const API_PATHS = {
  HEALTH: '/health',
  LOGIN: '/auth/login',
  ME: '/auth/me',
  USERS: '/users',
  PROJECTS: '/projects',
  project: (projectId: string) => `/projects/${encodeURIComponent(projectId)}`,
  activities: (projectId: string) => `${API_PATHS.project(projectId)}/activities`,
  activity: (projectId: string, activityId: string) =>
    `${API_PATHS.activities(projectId)}/${encodeURIComponent(activityId)}`,
  evm: (projectId: string) => `${API_PATHS.project(projectId)}/evm`,
} as const;

/** Typed function per endpoint of ARQUITECTURA §5; features consume these, never fetch directly. */
export function createApi(client: ApiClient) {
  return {
    getHealth: () => client.request<HealthResponse>(API_PATHS.HEALTH, { requiresAuth: false }),

    login: (credentials: LoginRequest) =>
      client.request<LoginResponse>(API_PATHS.LOGIN, {
        method: HTTP_METHOD.POST,
        body: credentials,
        requiresAuth: false,
      }),

    getMe: () => client.request<User>(API_PATHS.ME),

    listUsers: () => client.request<User[]>(API_PATHS.USERS),

    listProjects: () => client.request<Project[]>(API_PATHS.PROJECTS),

    getProject: (projectId: string) => client.request<Project>(API_PATHS.project(projectId)),

    createProject: (input: ProjectInput) =>
      client.request<Project>(API_PATHS.PROJECTS, { method: HTTP_METHOD.POST, body: input }),

    updateProject: (projectId: string, input: ProjectInput) =>
      client.request<Project>(API_PATHS.project(projectId), {
        method: HTTP_METHOD.PUT,
        body: input,
      }),

    deleteProject: (projectId: string) =>
      client.request<undefined>(API_PATHS.project(projectId), { method: HTTP_METHOD.DELETE }),

    listActivities: (projectId: string) =>
      client.request<Activity[]>(API_PATHS.activities(projectId)),

    createActivity: (projectId: string, input: ActivityInput) =>
      client.request<Activity>(API_PATHS.activities(projectId), {
        method: HTTP_METHOD.POST,
        body: input,
      }),

    updateActivity: (projectId: string, activityId: string, input: ActivityInput) =>
      client.request<Activity>(API_PATHS.activity(projectId, activityId), {
        method: HTTP_METHOD.PUT,
        body: input,
      }),

    deleteActivity: (projectId: string, activityId: string) =>
      client.request<undefined>(API_PATHS.activity(projectId, activityId), {
        method: HTTP_METHOD.DELETE,
      }),

    getEvmReport: (projectId: string) => client.request<EvmReport>(API_PATHS.evm(projectId)),
  };
}

export type Api = ReturnType<typeof createApi>;

export const api: Api = createApi(apiClient);
