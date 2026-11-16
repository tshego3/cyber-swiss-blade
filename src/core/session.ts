import { isAdministrator, type Grants, type SessionUser } from '../../shared/access';
import { derivePasswordKey, isSessionResponse, type SessionResponse } from '../../shared/auth';
import type { JsonObject } from '../../shared/protocol';
import { apiError, getMe, loadApiConfig, postLogin, postPassword, postSetup, putProfile, saveApiConfig, type ApiAuth } from './api';
import { clearSyncedData, deleteMeta, getMeta, listOutbox, setMeta } from './db';

const SESSION_KEY = 'session';
const LAST_USER_KEY = 'last-user-id';

export type Session = SessionResponse;
export type SessionListener = (session: Session | null) => void;

export interface SetupInput {
  readonly setupKey: string;
  readonly username: string;
  readonly displayName: string;
  readonly password: string;
}

const listeners = new Set<SessionListener>();
let current: Session | null = null;

export async function initSession(): Promise<Session | null> {
  const stored = await getMeta(SESSION_KEY);
  current = isSessionResponse(stored) ? stored : null;
  return current;
}

export function getSession(): Session | null {
  return current;
}

export function onSessionChange(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function canView(moduleId: string): boolean {
  return current?.grants[moduleId]?.view === true;
}

export function canEdit(moduleId: string): boolean {
  return current?.grants[moduleId]?.edit === true;
}

export function isAdmin(): boolean {
  return current !== null && isAdministrator(current.user.roles);
}

export async function apiAuth(): Promise<ApiAuth> {
  const config = await loadApiConfig();
  if (!config) throw apiError('not-configured');
  if (!current) throw apiError('signed-out');
  return { baseUrl: config.baseUrl, token: current.token };
}

export async function signIn(baseUrl: string, username: string, password: string): Promise<Session> {
  const name = username.trim().toLowerCase();
  const response = await postLogin(baseUrl, name, await derivePasswordKey(name, password));
  await saveApiConfig({ baseUrl });
  return applySession(response);
}

export async function setupAdministrator(baseUrl: string, input: SetupInput): Promise<Session> {
  const username = input.username.trim().toLowerCase();
  const response = await postSetup(baseUrl, {
    setupKey: input.setupKey,
    username,
    displayName: input.displayName,
    passwordKey: await derivePasswordKey(username, input.password),
  });
  await saveApiConfig({ baseUrl });
  return applySession(response);
}

export async function refreshSession(): Promise<void> {
  if (!current) return;
  await applySession(await getMe(await apiAuth()));
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const auth = await apiAuth();
  const username = current?.user.username ?? '';
  const [currentKey, newKey] = await Promise.all([derivePasswordKey(username, currentPassword), derivePasswordKey(username, newPassword)]);
  await applySession(await postPassword(auth, currentKey, newKey));
}

export async function updateProfile(profile: JsonObject): Promise<void> {
  await applySession(await putProfile(await apiAuth(), profile));
}

export async function pendingChanges(): Promise<number> {
  return (await listOutbox()).length;
}

export async function signOut(): Promise<void> {
  await clearSyncedData();
  await deleteMeta(SESSION_KEY);
  publish(null);
}

/** Drops a token the server rejected but keeps local data and pending changes for when the same user signs in again. */
export async function expireSession(): Promise<void> {
  if (!current) return;
  await deleteMeta(SESSION_KEY);
  publish(null);
}

export function sessionUser(): SessionUser | null {
  return current?.user ?? null;
}

export function sessionGrants(): Grants {
  return current?.grants ?? {};
}

async function applySession(response: SessionResponse): Promise<Session> {
  const lastUser = await getMeta(LAST_USER_KEY);
  if (typeof lastUser === 'string' && lastUser !== response.user.id) await clearSyncedData();
  await setMeta(LAST_USER_KEY, response.user.id);
  const { user } = response;
  await setMeta(SESSION_KEY, {
    token: response.token,
    expiresAt: response.expiresAt,
    user: { id: user.id, username: user.username, displayName: user.displayName, email: user.email, phone: user.phone, roles: [...user.roles] },
    grants: Object.fromEntries(Object.entries(response.grants).map(([id, grant]) => [id, { view: grant.view, edit: grant.edit }])),
  });
  publish(response);
  return response;
}

function publish(session: Session | null): void {
  current = session;
  for (const listener of listeners) listener(session);
}
