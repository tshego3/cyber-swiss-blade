export const ADMINISTRATORS = 'administrators';
export const REGISTERED = 'registered';
export const SYSTEM_ROLES: readonly string[] = [ADMINISTRATORS, REGISTERED];

export const ROLE_PATTERN = /^[a-z][a-z0-9-]{1,31}$/;
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{1,31}$/;
export const PASSWORD_KEY_PATTERN = /^[A-Za-z0-9+/]{43}=$/;

export interface ModuleAccess {
  readonly title: string;
  readonly collections: readonly string[];
  readonly ownerScoped: readonly string[];
  readonly defaultView: readonly string[];
  readonly defaultEdit: readonly string[];
}

export const MODULE_ACCESS = {
  timesheet: {
    title: 'Timesheet',
    collections: ['timesheet_codes', 'timesheet_logs', 'timesheet_prefs'],
    ownerScoped: ['timesheet_logs', 'timesheet_prefs'],
    defaultView: [REGISTERED],
    defaultEdit: [REGISTERED],
  },
  quotations: {
    title: 'Quotations',
    collections: ['quotation_clients', 'quotation_quotes', 'quotation_profile', 'quotation_catalogue', 'quotation_invoices'],
    ownerScoped: [],
    defaultView: [ADMINISTRATORS],
    defaultEdit: [ADMINISTRATORS],
  },
} as const satisfies Readonly<Record<string, ModuleAccess>>;

export type RestrictedModuleId = keyof typeof MODULE_ACCESS;

export const RESTRICTED_MODULES = Object.keys(MODULE_ACCESS) as readonly RestrictedModuleId[];

export interface ModuleRoles {
  readonly view: readonly string[];
  readonly edit: readonly string[];
}

export type RoleMap = Readonly<Record<string, ModuleRoles>>;

export interface Grant {
  readonly view: boolean;
  readonly edit: boolean;
}

export type Grants = Readonly<Record<string, Grant>>;

export interface SessionUser {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly email: string;
  readonly phone: string;
  readonly roles: readonly string[];
}

export function isRestrictedModule(id: string): id is RestrictedModuleId {
  return Object.hasOwn(MODULE_ACCESS, id);
}

export function moduleForCollection(collection: string): RestrictedModuleId | null {
  return RESTRICTED_MODULES.find((id) => (MODULE_ACCESS[id].collections as readonly string[]).includes(collection)) ?? null;
}

export function isOwnerScoped(collection: string): boolean {
  const module = moduleForCollection(collection);
  return module !== null && (MODULE_ACCESS[module].ownerScoped as readonly string[]).includes(collection);
}

export function defaultRoleMap(): RoleMap {
  return Object.fromEntries(RESTRICTED_MODULES.map((id) => [id, { view: MODULE_ACCESS[id].defaultView, edit: MODULE_ACCESS[id].defaultEdit }]));
}

export function effectiveRoles(roles: readonly string[]): readonly string[] {
  return [...new Set([...roles, REGISTERED])];
}

export function isAdministrator(roles: readonly string[]): boolean {
  return roles.includes(ADMINISTRATORS);
}

export function grantsFor(roles: readonly string[], roleMap: RoleMap): Grants {
  const effective = effectiveRoles(roles);
  const admin = isAdministrator(effective);
  const allows = (allowed: readonly string[] | undefined): boolean => admin || (allowed ?? []).some((role) => effective.includes(role));
  return Object.fromEntries(
    RESTRICTED_MODULES.map((id) => {
      const entry = roleMap[id];
      const edit = allows(entry?.edit);
      return [id, { view: edit || allows(entry?.view), edit }];
    }),
  );
}
