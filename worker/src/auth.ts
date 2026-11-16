import {
  ADMINISTRATORS,
  PASSWORD_KEY_PATTERN,
  USERNAME_PATTERN,
  defaultRoleMap,
  grantsFor,
  isAdministrator,
  isRestrictedModule,
  type Grants,
  type RoleMap,
  type SessionUser,
} from '../../shared/access';
import { isStringArray, type AdminUser, type SessionResponse } from '../../shared/auth';
import type { JsonObject } from '../../shared/protocol';
import { bearerToken, httpError, text } from './http';
import type { MongoDatabase } from './mongo/client';
import { isMongoServerError } from './mongo/connection';
import { issueToken, newSalt, passwordVerifier, sameSecret, verifyToken } from './session';
import { DUPLICATE_KEY, deleteOne, ensureUniqueIndex, findMany, findOne, insertOne, updateOne } from './store';

export const USERS = 'auth_users';
export const ROLES = 'auth_roles';
export const PERMISSIONS = 'auth_permissions';
const META = 'auth_meta';
const SETUP_ID = 'setup';
const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60_000;
const WRONG_LOGIN = 'The username or password is wrong.';

export interface AuthEnv {
  readonly secret: string;
  readonly sessionSecret: string;
  readonly now: () => number;
}

export interface UserDocument {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly email: string;
  readonly phone: string;
  readonly salt: string;
  readonly verifier: string;
  readonly roles: readonly string[];
  readonly disabled: boolean;
  readonly tokenVersion: number;
  readonly failedLogins: number;
  readonly lockedUntil: string;
  readonly createdAt: string;
}

export interface AuthContext {
  readonly user: UserDocument;
  readonly grants: Grants;
  readonly isAdmin: boolean;
}

export interface NewUser {
  readonly username: string;
  readonly displayName: string;
  readonly email: string;
  readonly phone: string;
  readonly roles: readonly string[];
  readonly passwordKey: string;
}

export function toUserDocument(json: JsonObject | null): UserDocument | null {
  if (!json) return null;
  const { _id, username, displayName, email, phone, salt, verifier, roles, disabled, tokenVersion, failedLogins, lockedUntil, createdAt } = json;
  if (typeof _id !== 'string' || typeof username !== 'string' || typeof displayName !== 'string' || typeof salt !== 'string' || typeof verifier !== 'string') return null;
  if (!isStringArray(roles) || typeof disabled !== 'boolean' || typeof tokenVersion !== 'number') return null;
  return {
    id: _id,
    username,
    displayName,
    email: typeof email === 'string' ? email : '',
    phone: typeof phone === 'string' ? phone : '',
    salt,
    verifier,
    roles,
    disabled,
    tokenVersion,
    failedLogins: typeof failedLogins === 'number' ? failedLogins : 0,
    lockedUntil: typeof lockedUntil === 'string' ? lockedUntil : '',
    createdAt: typeof createdAt === 'string' ? createdAt : '',
  };
}

export function toSessionUser(user: UserDocument): SessionUser {
  return { id: user.id, username: user.username, displayName: user.displayName, email: user.email, phone: user.phone, roles: user.roles };
}

export function toAdminUser(user: UserDocument): AdminUser {
  return { ...toSessionUser(user), disabled: user.disabled, createdAt: user.createdAt };
}

export function readPasswordKey(body: JsonObject, key: string): string {
  const value = body[key];
  if (typeof value !== 'string' || !PASSWORD_KEY_PATTERN.test(value)) throw httpError(400, 'The password is not valid.');
  return value;
}

export function readUsername(body: JsonObject): string {
  const username = text(body, 'username', 32).toLowerCase();
  if (!USERNAME_PATTERN.test(username)) throw httpError(400, 'Use 2 to 32 lowercase letters, digits, dots, dashes, or underscores for the username.');
  return username;
}

export async function loadUser(database: MongoDatabase, id: string): Promise<UserDocument | null> {
  return toUserDocument(await findOne(database, USERS, { _id: id }));
}

export async function loadRoleMap(database: MongoDatabase): Promise<RoleMap> {
  const roleMap: Record<string, { view: readonly string[]; edit: readonly string[] }> = { ...defaultRoleMap() };
  for (const document of await findMany(database, PERMISSIONS, {})) {
    const { _id, view, edit } = document;
    if (typeof _id === 'string' && isRestrictedModule(_id) && isStringArray(view) && isStringArray(edit)) roleMap[_id] = { view, edit };
  }
  return roleMap;
}

export async function sessionResponse(database: MongoDatabase, user: UserDocument, env: AuthEnv): Promise<SessionResponse> {
  const issued = await issueToken(env.sessionSecret, user.id, user.tokenVersion, env.now());
  return { ...issued, user: toSessionUser(user), grants: grantsFor(user.roles, await loadRoleMap(database)) };
}

export async function authenticate(database: MongoDatabase, request: Request, env: AuthEnv): Promise<AuthContext> {
  const payload = await verifyToken(env.sessionSecret, bearerToken(request), env.now());
  const user = payload ? await loadUser(database, payload.sub) : null;
  if (!payload || !user || user.disabled || user.tokenVersion !== payload.ver) throw httpError(401, 'Your session has ended. Sign in again.');
  return { user, grants: grantsFor(user.roles, await loadRoleMap(database)), isAdmin: isAdministrator(user.roles) };
}

export async function isSetupRequired(database: MongoDatabase): Promise<boolean> {
  return (await findOne(database, META, { _id: SETUP_ID })) === null;
}

export async function createUser(database: MongoDatabase, input: NewUser, now: number): Promise<UserDocument> {
  await ensureUniqueIndex(database, USERS, 'username');
  const salt = newSalt();
  const user: UserDocument = {
    id: crypto.randomUUID(),
    username: input.username,
    displayName: input.displayName,
    email: input.email,
    phone: input.phone,
    salt,
    verifier: await passwordVerifier(salt, input.passwordKey),
    roles: input.roles,
    disabled: false,
    tokenVersion: 1,
    failedLogins: 0,
    lockedUntil: '',
    createdAt: new Date(now).toISOString(),
  };
  const { id, ...fields } = user;
  try {
    await insertOne(database, USERS, { _id: id, ...fields });
  } catch (error) {
    if (isMongoServerError(error) && error.code === DUPLICATE_KEY) throw httpError(409, 'That username is taken.');
    throw error;
  }
  return user;
}

export async function handleSetup(database: MongoDatabase, body: JsonObject, env: AuthEnv): Promise<SessionResponse> {
  if (!(await sameSecret(env.secret, text(body, 'setupKey', 512)))) throw httpError(403, 'The setup key is wrong.');
  const input: NewUser = {
    username: readUsername(body),
    displayName: text(body, 'displayName', 80),
    email: text(body, 'email', 120, false),
    phone: text(body, 'phone', 40, false),
    roles: [ADMINISTRATORS],
    passwordKey: readPasswordKey(body, 'passwordKey'),
  };
  try {
    await insertOne(database, META, { _id: SETUP_ID, at: new Date(env.now()).toISOString() });
  } catch (error) {
    if (isMongoServerError(error) && error.code === DUPLICATE_KEY) throw httpError(409, 'Setup is already complete. Sign in instead.');
    throw error;
  }
  try {
    return await sessionResponse(database, await createUser(database, input, env.now()), env);
  } catch (error) {
    await deleteOne(database, META, { _id: SETUP_ID });
    throw error;
  }
}

export async function handleLogin(database: MongoDatabase, body: JsonObject, env: AuthEnv): Promise<SessionResponse> {
  const username = text(body, 'username', 64).toLowerCase();
  const passwordKey = body.passwordKey;
  if (typeof passwordKey !== 'string' || !PASSWORD_KEY_PATTERN.test(passwordKey)) throw httpError(401, WRONG_LOGIN);
  const user = toUserDocument(await findOne(database, USERS, { username }));
  if (!user) {
    await passwordVerifier(newSalt(), passwordKey);
    throw httpError(401, WRONG_LOGIN);
  }
  const now = env.now();
  if (user.lockedUntil && Date.parse(user.lockedUntil) > now) throw httpError(429, 'Too many failed attempts. Try again in 15 minutes.');
  if (!(await sameSecret(user.verifier, await passwordVerifier(user.salt, passwordKey)))) {
    const failedLogins = user.failedLogins + 1;
    const locked = failedLogins >= MAX_FAILED_LOGINS;
    await updateOne(database, USERS, { _id: user.id }, { $set: { failedLogins: locked ? 0 : failedLogins, lockedUntil: locked ? new Date(now + LOCK_MS).toISOString() : '' } });
    throw httpError(401, WRONG_LOGIN);
  }
  if (user.disabled) throw httpError(403, 'This account is disabled. Ask an administrator.');
  if (user.failedLogins > 0 || user.lockedUntil) await updateOne(database, USERS, { _id: user.id }, { $set: { failedLogins: 0, lockedUntil: '' } });
  return sessionResponse(database, user, env);
}

export async function handlePassword(database: MongoDatabase, context: AuthContext, body: JsonObject, env: AuthEnv): Promise<SessionResponse> {
  const currentKey = readPasswordKey(body, 'currentKey');
  const newKey = readPasswordKey(body, 'newKey');
  if (!(await sameSecret(context.user.verifier, await passwordVerifier(context.user.salt, currentKey)))) throw httpError(403, 'The current password is wrong.');
  const salt = newSalt();
  const tokenVersion = context.user.tokenVersion + 1;
  const verifier = await passwordVerifier(salt, newKey);
  await updateOne(database, USERS, { _id: context.user.id }, { $set: { salt, verifier, tokenVersion } });
  return sessionResponse(database, { ...context.user, salt, verifier, tokenVersion }, env);
}

export async function handleProfile(database: MongoDatabase, context: AuthContext, body: JsonObject, env: AuthEnv): Promise<SessionResponse> {
  const profile = { displayName: text(body, 'displayName', 80), email: text(body, 'email', 120, false), phone: text(body, 'phone', 40, false) };
  await updateOne(database, USERS, { _id: context.user.id }, { $set: profile });
  return sessionResponse(database, { ...context.user, ...profile }, env);
}
