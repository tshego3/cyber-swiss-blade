import { ADMINISTRATORS, MODULE_ACCESS, REGISTERED, ROLE_PATTERN, SYSTEM_ROLES, isRestrictedModule } from '../../shared/access';
import { isStringArray, type AdminUser, type ModulePermission, type RoleRecord } from '../../shared/auth';
import type { JsonObject } from '../../shared/protocol';
import { PERMISSIONS, ROLES, USERS, createUser, loadRoleMap, loadUser, readPasswordKey, readUsername, toAdminUser, toUserDocument, type AuthContext } from './auth';
import { httpError, text } from './http';
import type { MongoDatabase } from './mongo/client';
import { isMongoServerError } from './mongo/connection';
import { newSalt, passwordVerifier } from './session';
import { DUPLICATE_KEY, deleteOne, findMany, insertOne, updateMany, updateOne } from './store';

const SYSTEM_ROLE_RECORDS: readonly RoleRecord[] = [
  { id: ADMINISTRATORS, name: 'Administrators', description: 'Full access. Manages users, roles, and permissions.', system: true },
  { id: REGISTERED, name: 'Registered users', description: 'Every signed-in user.', system: true },
];

export type AdminResult = readonly AdminUser[] | AdminUser | readonly RoleRecord[] | RoleRecord | readonly ModulePermission[] | { readonly ok: true };

export async function handleAdmin(database: MongoDatabase, context: AuthContext, method: string, path: readonly string[], body: () => Promise<JsonObject>, now: number): Promise<AdminResult> {
  if (!context.isAdmin) throw httpError(403, 'Only administrators can do this.');
  const [resource, id] = path;
  if (resource === 'users' && method === 'GET' && !id) return listUsers(database);
  if (resource === 'users' && method === 'POST' && !id) return addUser(database, await body(), now);
  if (resource === 'users' && method === 'PUT' && id) return editUser(database, context, id, await body());
  if (resource === 'roles' && method === 'GET' && !id) return listRoles(database);
  if (resource === 'roles' && method === 'POST' && !id) return addRole(database, await body());
  if (resource === 'roles' && method === 'PUT' && id) return editRole(database, id, await body());
  if (resource === 'roles' && method === 'DELETE' && id) return removeRole(database, id);
  if (resource === 'permissions' && method === 'GET' && !id) return listPermissions(database);
  if (resource === 'permissions' && method === 'PUT' && id) return editPermissions(database, id, await body());
  throw httpError(404, 'Not found.');
}

async function listUsers(database: MongoDatabase): Promise<AdminUser[]> {
  const documents = await findMany(database, USERS, {}, { sort: { username: 1 } });
  return documents.map(toUserDocument).flatMap((user) => (user ? [toAdminUser(user)] : []));
}

async function addUser(database: MongoDatabase, body: JsonObject, now: number): Promise<AdminUser> {
  const user = await createUser(
    database,
    {
      username: readUsername(body),
      displayName: text(body, 'displayName', 80),
      email: text(body, 'email', 120, false),
      phone: text(body, 'phone', 40, false),
      roles: await readRoles(database, body.roles),
      passwordKey: readPasswordKey(body, 'passwordKey'),
    },
    now,
  );
  return toAdminUser(user);
}

async function editUser(database: MongoDatabase, context: AuthContext, id: string, body: JsonObject): Promise<AdminUser> {
  const user = await loadUser(database, id);
  if (!user) throw httpError(404, 'The user does not exist.');
  const roles = body.roles === undefined ? user.roles : await readRoles(database, body.roles);
  const disabled = typeof body.disabled === 'boolean' ? body.disabled : user.disabled;
  const losesAdmin = user.roles.includes(ADMINISTRATORS) && !user.disabled && (!roles.includes(ADMINISTRATORS) || disabled);
  if (losesAdmin && user.id === context.user.id) throw httpError(400, 'You cannot remove your own administrator access.');
  if (losesAdmin && (await countActiveAdmins(database)) <= 1) throw httpError(400, 'At least one active administrator must remain.');

  let tokenVersion = user.tokenVersion + (body.signOut === true || disabled ? 1 : 0);
  const changes: Record<string, string | boolean | number | readonly string[]> = {
    displayName: body.displayName === undefined ? user.displayName : text(body, 'displayName', 80),
    email: body.email === undefined ? user.email : text(body, 'email', 120, false),
    phone: body.phone === undefined ? user.phone : text(body, 'phone', 40, false),
    roles,
    disabled,
  };
  if (body.passwordKey !== undefined) {
    const salt = newSalt();
    changes.salt = salt;
    changes.verifier = await passwordVerifier(salt, readPasswordKey(body, 'passwordKey'));
    changes.failedLogins = 0;
    changes.lockedUntil = '';
    tokenVersion = user.tokenVersion + 1;
  }
  changes.tokenVersion = tokenVersion;
  await updateOne(database, USERS, { _id: id }, { $set: changes });
  const updated = await loadUser(database, id);
  if (!updated) throw httpError(404, 'The user does not exist.');
  return toAdminUser(updated);
}

async function countActiveAdmins(database: MongoDatabase): Promise<number> {
  return (await findMany(database, USERS, { roles: ADMINISTRATORS, disabled: false })).length;
}

async function listRoles(database: MongoDatabase): Promise<RoleRecord[]> {
  const custom = (await findMany(database, ROLES, {}, { sort: { name: 1 } })).flatMap((document): RoleRecord[] => {
    const { _id, name, description } = document;
    return typeof _id === 'string' && typeof name === 'string' ? [{ id: _id, name, description: typeof description === 'string' ? description : '', system: false }] : [];
  });
  return [...SYSTEM_ROLE_RECORDS, ...custom];
}

async function addRole(database: MongoDatabase, body: JsonObject): Promise<RoleRecord> {
  const id = text(body, 'id', 32).toLowerCase();
  if (!ROLE_PATTERN.test(id) || SYSTEM_ROLES.includes(id)) throw httpError(400, 'Use 2 to 32 lowercase letters, digits, or dashes for the role ID.');
  const role: RoleRecord = { id, name: text(body, 'name', 60), description: text(body, 'description', 200, false), system: false };
  try {
    await insertOne(database, ROLES, { _id: id, name: role.name, description: role.description });
  } catch (error) {
    if (isMongoServerError(error) && error.code === DUPLICATE_KEY) throw httpError(409, 'A role with that ID exists.');
    throw error;
  }
  return role;
}

async function editRole(database: MongoDatabase, id: string, body: JsonObject): Promise<RoleRecord> {
  if (SYSTEM_ROLES.includes(id)) throw httpError(400, 'System roles cannot change.');
  const role: RoleRecord = { id, name: text(body, 'name', 60), description: text(body, 'description', 200, false), system: false };
  const matched = await updateOne(database, ROLES, { _id: id }, { $set: { name: role.name, description: role.description } });
  if (matched === 0) throw httpError(404, 'The role does not exist.');
  return role;
}

async function removeRole(database: MongoDatabase, id: string): Promise<{ readonly ok: true }> {
  if (SYSTEM_ROLES.includes(id)) throw httpError(400, 'System roles cannot be deleted.');
  await deleteOne(database, ROLES, { _id: id });
  await updateMany(database, USERS, { roles: id }, { $pull: { roles: id } });
  await updateMany(database, PERMISSIONS, {}, { $pull: { view: id, edit: id } });
  return { ok: true };
}

async function listPermissions(database: MongoDatabase): Promise<ModulePermission[]> {
  const roleMap = await loadRoleMap(database);
  return Object.entries(MODULE_ACCESS).map(([id, access]) => ({ id, title: access.title, view: roleMap[id]?.view ?? [], edit: roleMap[id]?.edit ?? [] }));
}

async function editPermissions(database: MongoDatabase, id: string, body: JsonObject): Promise<readonly ModulePermission[]> {
  if (!isRestrictedModule(id)) throw httpError(404, 'The module does not exist.');
  const view = await readRoles(database, body.view);
  const edit = await readRoles(database, body.edit);
  await updateOne(database, PERMISSIONS, { _id: id }, { $set: { view, edit } }, true);
  return listPermissions(database);
}

async function readRoles(database: MongoDatabase, value: JsonObject[string] | undefined): Promise<string[]> {
  if (!isStringArray(value)) throw httpError(400, 'Roles must be a list.');
  const known = new Set((await listRoles(database)).map((role) => role.id));
  const roles = [...new Set(value)];
  if (roles.some((role) => !known.has(role))) throw httpError(400, 'A role does not exist.');
  return roles;
}
