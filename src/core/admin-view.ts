import { ADMINISTRATORS, REGISTERED } from '../../shared/access';
import { MIN_PASSWORD_LENGTH, derivePasswordKey, type AdminUser, type ModulePermission, type RoleRecord } from '../../shared/auth';
import type { JsonObject } from '../../shared/protocol';
import { admin, errorMessage } from './api';
import { el, replaceChildren, type Child } from './dom';
import { formatDate } from './format';
import { apiAuth, refreshSession, sessionUser } from './session';
import type { Unmount } from './types';
import { button, confirmAction, emptyState, errorState, field, formChecked, formValue, loadingState, moduleHeader, openFormDialog, toast } from './ui';

type Section = 'users' | 'roles' | 'permissions';

const SECTIONS: readonly { readonly id: Section; readonly label: string }[] = [
  { id: 'users', label: 'Users' },
  { id: 'roles', label: 'Roles' },
  { id: 'permissions', label: 'Permissions' },
];

export function mountAdmin(root: HTMLElement, path: readonly string[]): Unmount {
  const section: Section = SECTIONS.find((item) => item.id === path[0])?.id ?? 'users';
  const body = el('div', { class: 'stack-lg' });
  const actions: Child[] = [];
  let disposed = false;

  const load = async (): Promise<void> => {
    replaceChildren(body, [loadingState('Loading administration data')]);
    try {
      const auth = await apiAuth();
      const roles = await admin.roles(auth);
      if (disposed) return;
      if (section === 'users') renderUsers(body, await admin.users(auth), roles, load);
      if (section === 'roles') renderRoles(body, roles, load);
      if (section === 'permissions') renderPermissions(body, await admin.permissions(auth), roles);
    } catch (error) {
      if (!disposed) replaceChildren(body, [errorState(errorMessage(error, 'Administration data could not be loaded.'), () => void load())]);
    }
  };

  if (section === 'users') actions.push(button({ label: 'Add user', icon: 'plus', variant: 'primary', onClick: () => void openUserDialog(null, load) }));
  if (section === 'roles') actions.push(button({ label: 'Add role', icon: 'plus', variant: 'primary', onClick: () => openRoleDialog(null, load) }));

  replaceChildren(root, [
    moduleHeader(
      { title: 'Administration', subtitle: 'Users, roles, and module permissions. Changes need an internet connection.', actions },
      'Administration sections',
      SECTIONS.map((item) => ({ label: item.label, href: `#/admin/${item.id}`, active: item.id === section })),
    ),
    body,
  ]);
  void load();
  return () => {
    disposed = true;
    root.replaceChildren();
  };
}

function roleNames(roles: readonly RoleRecord[]): ReadonlyMap<string, string> {
  return new Map(roles.map((role) => [role.id, role.name]));
}

function table(headings: readonly string[], rows: readonly HTMLTableRowElement[]): HTMLElement {
  return el('div', { class: 'card table-card' }, [
    el('table', { class: 'data-table' }, [el('thead', {}, [el('tr', {}, headings.map((heading) => el('th', { text: heading, attrs: { scope: 'col' } })))]), el('tbody', {}, rows)]),
  ]);
}

function renderUsers(body: HTMLElement, users: readonly AdminUser[], roles: readonly RoleRecord[], reload: () => Promise<void>): void {
  if (users.length === 0) {
    replaceChildren(body, [emptyState({ icon: 'users', title: 'No users', text: 'Add the people on your team.' })]);
    return;
  }
  const names = roleNames(roles);
  const rows = users.map((user) =>
    el('tr', {}, [
      el('td', {}, [el('span', { class: 'cell-title', text: user.displayName }), el('span', { class: 'cell-meta mono', text: user.username })]),
      el('td', { text: user.email || '-' }),
      el('td', {}, [el('span', { class: 'tags' }, (user.roles.length > 0 ? user.roles : [REGISTERED]).map((role) => el('span', { class: 'tag', text: names.get(role) ?? role })))]),
      el('td', {}, [el('span', { class: `badge ${user.disabled ? 'badge-declined' : 'badge-accepted'}`, text: user.disabled ? 'Disabled' : 'Active' })]),
      el('td', { class: 'cell-meta', text: user.createdAt ? formatDate(user.createdAt.slice(0, 10)) : '-' }),
      el('td', { class: 'cell-actions' }, [button({ label: `Edit ${user.displayName}`, icon: 'edit', iconOnly: true, variant: 'ghost', onClick: () => void openUserDialog({ user, roles }, reload) })]),
    ]),
  );
  replaceChildren(body, [table(['User', 'Email', 'Roles', 'Status', 'Created', ''], rows)]);
}

function roleChecks(roles: readonly RoleRecord[], selected: readonly string[]): HTMLElement {
  return el('fieldset', { class: 'check-list' }, [
    el('legend', { class: 'field-label', text: 'Roles' }),
    ...roles.map((role) =>
      el('label', { class: 'check' }, [
        el('input', { attrs: { type: 'checkbox', name: `role:${role.id}`, checked: role.id === REGISTERED || selected.includes(role.id), disabled: role.id === REGISTERED } }),
        el('span', { text: role.id === REGISTERED ? `${role.name} (always)` : role.name }),
      ]),
    ),
  ]);
}

function selectedRoles(form: HTMLFormElement, roles: readonly RoleRecord[]): string[] {
  return roles.filter((role) => role.id !== REGISTERED && formChecked(form, `role:${role.id}`)).map((role) => role.id);
}

function passwordInput(name: string, required: boolean): HTMLInputElement {
  return el('input', { class: 'input', attrs: { name, type: 'password', minlength: MIN_PASSWORD_LENGTH, required, autocomplete: 'new-password' } });
}

function textInput(name: string, value: string, attrs: Readonly<Record<string, string | boolean>> = {}): HTMLInputElement {
  return el('input', { class: 'input', attrs: { name, type: 'text', value, autocomplete: 'off', ...attrs } });
}

async function openUserDialog(existing: { readonly user: AdminUser; readonly roles: readonly RoleRecord[] } | null, reload: () => Promise<void>): Promise<void> {
  const roles = existing?.roles ?? (await admin.roles(await apiAuth()).catch(() => []));
  const user = existing?.user;
  // A new password or a sign-out bumps the token version, which would revoke this administrator's own session.
  const isSelf = user !== undefined && user.id === sessionUser()?.id;
  openFormDialog({
    title: user ? `Edit ${user.displayName}` : 'Add user',
    submitLabel: user ? 'Save user' : 'Add user',
    body: [
      user
        ? el('p', { class: 'dialog-text mono', text: user.username })
        : field('Username', textInput('username', '', { required: true, pattern: '[a-z0-9][a-z0-9._\\-]{1,31}', autocapitalize: 'none' }), 'Lowercase letters, digits, dots, dashes, or underscores.'),
      field('Display name', textInput('displayName', user?.displayName ?? '', { required: true })),
      el('div', { class: 'grid-2' }, [field('Email', textInput('email', user?.email ?? '', { type: 'email' })), field('Phone', textInput('phone', user?.phone ?? '', { type: 'tel' }))]),
      roleChecks(roles, user?.roles ?? []),
      isSelf && el('p', { class: 'muted small', text: 'To change your own password, use Settings.' }),
      !isSelf && field(user ? 'New password (optional)' : 'Password', passwordInput('password', !user), `At least ${MIN_PASSWORD_LENGTH} characters. Give it to the person in a safe way.`),
      !isSelf && field('Confirm password', passwordInput('confirm', !user)),
      user &&
        !isSelf &&
        el('div', { class: 'stack' }, [
          el('label', { class: 'check' }, [el('input', { attrs: { type: 'checkbox', name: 'disabled', checked: user.disabled } }), el('span', { text: 'Disable this account' })]),
          el('label', { class: 'check' }, [el('input', { attrs: { type: 'checkbox', name: 'signOut' } }), el('span', { text: 'Sign out on all devices' })]),
        ]),
    ],
    onSubmit: async (form) => {
      const password = new FormData(form).get('password')?.toString() ?? '';
      if (password !== (new FormData(form).get('confirm')?.toString() ?? '')) {
        toast('The passwords do not match.', 'error');
        return false;
      }
      try {
        const auth = await apiAuth();
        const username = user?.username ?? formValue(form, 'username').toLowerCase();
        const changes: JsonObject = {
          displayName: formValue(form, 'displayName'),
          email: formValue(form, 'email'),
          phone: formValue(form, 'phone'),
          roles: selectedRoles(form, roles),
          ...(password ? { passwordKey: await derivePasswordKey(username, password) } : {}),
        };
        if (user) await admin.updateUser(auth, user.id, { ...changes, disabled: formChecked(form, 'disabled'), signOut: formChecked(form, 'signOut') });
        else await admin.createUser(auth, { ...changes, username });
        toast(user ? 'User saved' : 'User added', 'success');
        if (user?.id === sessionUser()?.id) await refreshSession();
        await reload();
        return true;
      } catch (error) {
        toast(errorMessage(error, 'The user could not be saved.'), 'error');
        return false;
      }
    },
  });
}

function renderRoles(body: HTMLElement, roles: readonly RoleRecord[], reload: () => Promise<void>): void {
  const rows = roles.map((role) =>
    el('tr', {}, [
      el('td', {}, [el('span', { class: 'cell-title', text: role.name }), el('span', { class: 'cell-meta mono', text: role.id })]),
      el('td', { text: role.description || '-' }),
      el('td', {}, [role.system && el('span', { class: 'tag', text: 'System' })]),
      el('td', { class: 'cell-actions' }, [
        !role.system && button({ label: `Edit ${role.name}`, icon: 'edit', iconOnly: true, variant: 'ghost', onClick: () => openRoleDialog(role, reload) }),
        !role.system && button({ label: `Delete ${role.name}`, icon: 'trash', iconOnly: true, variant: 'ghost', onClick: () => void deleteRole(role, reload) }),
      ]),
    ]),
  );
  replaceChildren(body, [table(['Role', 'Description', '', ''], rows)]);
}

function openRoleDialog(role: RoleRecord | null, reload: () => Promise<void>): void {
  openFormDialog({
    title: role ? `Edit ${role.name}` : 'Add role',
    submitLabel: role ? 'Save role' : 'Add role',
    body: [
      role
        ? el('p', { class: 'dialog-text mono', text: role.id })
        : field('Role ID', textInput('id', '', { required: true, pattern: '[a-z][a-z0-9\\-]{1,31}', placeholder: 'quotation-editors' }), 'Lowercase letters, digits, and dashes. You cannot change it later.'),
      field('Name', textInput('name', role?.name ?? '', { required: true, placeholder: 'Quotation editors' })),
      field('Description', textInput('description', role?.description ?? '')),
    ],
    onSubmit: async (form) => {
      try {
        const auth = await apiAuth();
        const fields: JsonObject = { name: formValue(form, 'name'), description: formValue(form, 'description') };
        if (role) await admin.updateRole(auth, role.id, fields);
        else await admin.createRole(auth, { ...fields, id: formValue(form, 'id') });
        toast(role ? 'Role saved' : 'Role added', 'success');
        await reload();
        return true;
      } catch (error) {
        toast(errorMessage(error, 'The role could not be saved.'), 'error');
        return false;
      }
    },
  });
}

async function deleteRole(role: RoleRecord, reload: () => Promise<void>): Promise<void> {
  if (!(await confirmAction(`Delete ${role.name}`, 'Users lose this role, and module permissions stop using it.', 'Delete role'))) return;
  try {
    await admin.deleteRole(await apiAuth(), role.id);
    toast('Role deleted', 'success');
    await reload();
  } catch (error) {
    toast(errorMessage(error, 'The role could not be deleted.'), 'error');
  }
}

function renderPermissions(body: HTMLElement, permissions: readonly ModulePermission[], roles: readonly RoleRecord[]): void {
  const cards = permissions.map((permission) => permissionCard(permission, roles));
  replaceChildren(body, [el('p', { class: 'muted', text: 'Edit includes View. Administrators always have full access. Changes apply at the next sync.' }), ...cards]);
}

function permissionCard(permission: ModulePermission, roles: readonly RoleRecord[]): HTMLElement {
  let view = new Set(permission.view);
  let edit = new Set(permission.edit);
  const save = async (): Promise<void> => {
    try {
      const updated = await admin.updatePermissions(await apiAuth(), permission.id, { view: [...view], edit: [...edit] });
      const saved = updated.find((item) => item.id === permission.id);
      if (saved) {
        view = new Set(saved.view);
        edit = new Set(saved.edit);
      }
      toast(`${permission.title} permissions saved`, 'success');
      await refreshSession();
    } catch (error) {
      toast(errorMessage(error, 'The permissions could not be saved.'), 'error');
    }
  };
  const rows = roles.map((role) => {
    const locked = role.id === ADMINISTRATORS;
    const viewBox = el('input', { attrs: { type: 'checkbox', checked: locked || view.has(role.id) || edit.has(role.id), disabled: locked, 'aria-label': `${role.name} can view ${permission.title}` } });
    const editBox = el('input', { attrs: { type: 'checkbox', checked: locked || edit.has(role.id), disabled: locked, 'aria-label': `${role.name} can edit ${permission.title}` } });
    viewBox.addEventListener('change', () => {
      if (viewBox.checked) view.add(role.id);
      else {
        view.delete(role.id);
        edit.delete(role.id);
        editBox.checked = false;
      }
      void save();
    });
    editBox.addEventListener('change', () => {
      if (editBox.checked) {
        edit.add(role.id);
        view.add(role.id);
        viewBox.checked = true;
      } else edit.delete(role.id);
      void save();
    });
    return el('tr', {}, [el('td', { text: role.name }), el('td', { class: 'cell-center' }, [viewBox]), el('td', { class: 'cell-center' }, [editBox])]);
  });
  return el('section', { class: 'stack' }, [el('h2', { class: 'section-title', text: permission.title }), table(['Role', 'View', 'Edit'], rows)]);
}
