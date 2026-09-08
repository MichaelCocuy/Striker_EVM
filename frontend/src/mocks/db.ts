import { SEED_ACTIVITIES, SEED_PASSWORD, SEED_PROJECT, SEED_USERS } from './seed';

import type { Activity, Project, User } from '@/api/types';

export interface MockUser extends User {
  password: string;
}

/** In-memory state behind the MSW handlers; reset between tests with `resetMockDatabase()`. */
export interface MockDatabase {
  users: MockUser[];
  projects: Project[];
  activities: Activity[];
}

function cloneSeed(): MockDatabase {
  return {
    users: SEED_USERS.map((user) => ({ ...user, password: SEED_PASSWORD })),
    projects: [structuredClone(SEED_PROJECT)],
    activities: SEED_ACTIVITIES.map((activity) => structuredClone(activity)),
  };
}

export function createMockDatabase(): MockDatabase {
  return cloneSeed();
}

export const mockDb: MockDatabase = createMockDatabase();

export function resetMockDatabase(db: MockDatabase = mockDb): void {
  const fresh = cloneSeed();
  db.users = fresh.users;
  db.projects = fresh.projects;
  db.activities = fresh.activities;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function findUserByEmail(db: MockDatabase, email: string): MockUser | undefined {
  const normalized = email.trim().toLowerCase();
  return db.users.find((user) => user.email.toLowerCase() === normalized);
}

export function findUserById(db: MockDatabase, userId: string): MockUser | undefined {
  return db.users.find((user) => user.id === userId);
}

export function toPublicUser({ password: _password, ...user }: MockUser): User {
  return user;
}

export function findProject(db: MockDatabase, projectId: string): Project | undefined {
  return db.projects.find((project) => project.id === projectId);
}

export function countActivities(db: MockDatabase, projectId: string): number {
  return db.activities.filter((activity) => activity.projectId === projectId).length;
}

export function withActivityCount(db: MockDatabase, project: Project): Project {
  return { ...project, activityCount: countActivities(db, project.id) };
}

export function findActivity(
  db: MockDatabase,
  projectId: string,
  activityId: string,
): Activity | undefined {
  return db.activities.find(
    (activity) => activity.projectId === projectId && activity.id === activityId,
  );
}
