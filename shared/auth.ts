import type { Grants, SessionUser } from './access';
import { bytesToBase64, utf8Encode } from './bytes';
import { isJsonObject } from './protocol';

export const PASSWORD_ITERATIONS = 600_000;
export const MIN_PASSWORD_LENGTH = 10;

export interface SessionResponse {
  readonly token: string;
  readonly expiresAt: string;
  readonly user: SessionUser;
  readonly grants: Grants;
}

export interface AdminUser extends SessionUser {
  readonly disabled: boolean;
  readonly createdAt: string;
}

export interface RoleRecord {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly system: boolean;
}

export interface ModulePermission {
  readonly id: string;
  readonly title: string;
  readonly view: readonly string[];
  readonly edit: readonly string[];
}

export async function derivePasswordKey(username: string, password: string): Promise<string> {
  const material = await crypto.subtle.importKey('raw', utf8Encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
  const salt = utf8Encode(`csb:v1:${username.trim().toLowerCase()}`);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PASSWORD_ITERATIONS, hash: 'SHA-256' }, material, 256);
  return bytesToBase64(new Uint8Array(bits));
}

export function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item: unknown) => typeof item === 'string');
}

export function isSessionUser(value: unknown): value is SessionUser {
  return (
    isJsonObject(value) &&
    typeof value.id === 'string' &&
    typeof value.username === 'string' &&
    typeof value.displayName === 'string' &&
    typeof value.email === 'string' &&
    typeof value.phone === 'string' &&
    isStringArray(value.roles)
  );
}

export function isGrants(value: unknown): value is Grants {
  return isJsonObject(value) && Object.values(value).every((grant) => isJsonObject(grant) && typeof grant.view === 'boolean' && typeof grant.edit === 'boolean');
}

export function isSessionResponse(value: unknown): value is SessionResponse {
  return isJsonObject(value) && typeof value.token === 'string' && typeof value.expiresAt === 'string' && isSessionUser(value.user) && isGrants(value.grants);
}

export function isAdminUser(value: unknown): value is AdminUser {
  return isSessionUser(value) && isJsonObject(value) && typeof value.disabled === 'boolean' && typeof value.createdAt === 'string';
}

export function isRoleRecord(value: unknown): value is RoleRecord {
  return isJsonObject(value) && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.description === 'string' && typeof value.system === 'boolean';
}

export function isModulePermission(value: unknown): value is ModulePermission {
  return isJsonObject(value) && typeof value.id === 'string' && typeof value.title === 'string' && isStringArray(value.view) && isStringArray(value.edit);
}
