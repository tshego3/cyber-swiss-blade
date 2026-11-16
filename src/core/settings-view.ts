import { ADMINISTRATORS } from '../../shared/access';
import { MIN_PASSWORD_LENGTH } from '../../shared/auth';
import { errorMessage, fetchStatus, loadApiConfig, normalizeBaseUrl, saveApiConfig } from './api';
import { eraseAllData } from './db';
import { el, replaceChildren } from './dom';
import { changePassword, getSession, onSessionChange, updateProfile, type Session } from './session';
import { confirmSignOut } from './sign-out';
import { describeSyncState } from './sync-status';
import type { SyncEngine } from './sync';
import { getThemePreference, setThemePreference } from './theme';
import type { ApiConfig, ThemePreference, Unmount } from './types';
import { button, confirmAction, field, formValue, openFormDialog, pageHeader, segmented, toast } from './ui';

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: ThemePreference; label: string }[];

function section(title: string, description: string, body: readonly HTMLElement[]): HTMLElement {
  return el('section', { class: 'card settings-section' }, [
    el('div', { class: 'settings-intro' }, [el('h2', { class: 'section-title', text: title }), el('p', { class: 'muted', text: description })]),
    el('div', { class: 'settings-body' }, body),
  ]);
}

function serverForm(config: ApiConfig | null, sync: SyncEngine): HTMLFormElement {
  const form = el('form', { class: 'stack', attrs: { novalidate: true } }, [
    field('Server URL', el('input', { class: 'input', attrs: { name: 'baseUrl', type: 'url', required: true, placeholder: 'https://cyber-swiss-blade-api.you.workers.dev', value: config?.baseUrl ?? '', autocomplete: 'off' } }), 'Your Cloudflare Worker address.'),
    el('div', { class: 'row' }, [button({ label: 'Save server', icon: 'check', type: 'submit' })]),
  ]);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (form.reportValidity()) void saveServer(form, sync);
  });
  return form;
}

async function saveServer(form: HTMLFormElement, sync: SyncEngine): Promise<void> {
  const baseUrl = normalizeBaseUrl(formValue(form, 'baseUrl'));
  if (!baseUrl) {
    toast('Use an https:// address.', 'error');
    return;
  }
  try {
    const status = await fetchStatus(baseUrl);
    await saveApiConfig({ baseUrl });
    toast(status.setupRequired ? 'Connected. Sign in to create the administrator.' : `Connected to ${status.database}`, 'success');
    await sync.syncNow();
  } catch (error) {
    toast(errorMessage(error, 'Could not reach the sync server.'), 'error');
  }
}

function accountBody(session: Session | null, navigate: (path: string) => void): HTMLElement[] {
  if (!session) return [el('p', { class: 'muted', text: 'You are not signed in. Timesheet and Quotations need an account.' }), el('div', { class: 'row' }, [button({ label: 'Sign in', icon: 'lock', variant: 'primary', onClick: () => navigate('sign-in') })])];
  const { user } = session;
  const roles = user.roles.includes(ADMINISTRATORS) ? 'Administrator' : 'Registered user';
  const profile = el('form', { class: 'stack', attrs: { novalidate: true } }, [
    el('p', {}, [el('strong', { text: user.displayName }), el('span', { class: 'muted', text: ` · ${user.username} · ${roles}` })]),
    field('Display name', el('input', { class: 'input', attrs: { name: 'displayName', required: true, value: user.displayName, autocomplete: 'name' } })),
    el('div', { class: 'grid-2' }, [
      field('Email', el('input', { class: 'input', attrs: { name: 'email', type: 'email', value: user.email, autocomplete: 'email' } }), 'Printed on your quotes and invoices.'),
      field('Phone', el('input', { class: 'input', attrs: { name: 'phone', type: 'tel', value: user.phone, autocomplete: 'tel' } })),
    ]),
    el('div', { class: 'row' }, [
      button({ label: 'Save profile', icon: 'check', type: 'submit' }),
      button({ label: 'Change password', icon: 'lock', variant: 'ghost', onClick: openPasswordDialog }),
      button({ label: 'Sign out', variant: 'ghost', onClick: () => void confirmSignOut() }),
    ]),
  ]);
  profile.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!profile.reportValidity()) return;
    updateProfile({ displayName: formValue(profile, 'displayName'), email: formValue(profile, 'email'), phone: formValue(profile, 'phone') })
      .then(() => toast('Profile saved', 'success'))
      .catch((error: unknown) => toast(errorMessage(error, 'The profile could not be saved.'), 'error'));
  });
  return [profile];
}

function openPasswordDialog(): void {
  const passwordField = (name: string, autocomplete: string): HTMLInputElement =>
    el('input', { class: 'input', attrs: { name, type: 'password', required: true, minlength: name === 'current' ? 1 : MIN_PASSWORD_LENGTH, autocomplete } });
  openFormDialog({
    title: 'Change password',
    submitLabel: 'Change password',
    body: [
      field('Current password', passwordField('current', 'current-password')),
      field('New password', passwordField('next', 'new-password'), `At least ${MIN_PASSWORD_LENGTH} characters. Other devices sign out.`),
      field('Confirm new password', passwordField('confirm', 'new-password')),
    ],
    onSubmit: async (form) => {
      const data = new FormData(form);
      const next = data.get('next')?.toString() ?? '';
      if (next !== data.get('confirm')?.toString()) {
        toast('The new passwords do not match.', 'error');
        return false;
      }
      try {
        await changePassword(data.get('current')?.toString() ?? '', next);
        toast('Password changed', 'success');
        return true;
      } catch (error) {
        toast(errorMessage(error, 'The password could not be changed.'), 'error');
        return false;
      }
    },
  });
}

async function erase(): Promise<void> {
  const confirmed = await confirmAction('Erase local data', 'This removes every record, pending change, and setting stored on this device, and signs you out. Synced data stays in MongoDB.', 'Erase');
  if (!confirmed) return;
  await eraseAllData();
  window.location.reload();
}

export function mountSettings(root: HTMLElement, sync: SyncEngine, navigate: (path: string) => void): Unmount {
  const status = el('p', { class: 'muted' });
  const unsubscribe = sync.subscribe((state) => {
    const view = describeSyncState(state);
    status.textContent = `${view.label}. ${view.detail}.`;
  });
  const serverBody = el('div', { class: 'stack' }, [status]);
  void loadApiConfig().then((config) => serverBody.append(serverForm(config, sync)));
  const account = el('div', { class: 'stack' }, accountBody(getSession(), navigate));
  const stopSession = onSessionChange((session) => replaceChildren(account, accountBody(session, navigate)));

  replaceChildren(root, [
    el('div', { class: 'module-header' }, [pageHeader({ title: 'Settings', subtitle: 'Account, sync, appearance, and local data.' })]),
    el('div', { class: 'stack-lg' }, [
      section('Account', 'Your sign-in, profile, and password.', [account]),
      section('Server', 'Timesheet and Quotations data is stored on this device first and synced to MongoDB through your Cloudflare Worker.', [serverBody]),
      section('Appearance', 'Follow the system or pick a theme.', [segmented('Theme', THEME_OPTIONS, getThemePreference(), setThemePreference)]),
      section('Local data', 'Clear this device. Use it before handing over a shared machine.', [button({ label: 'Erase local data', icon: 'trash', variant: 'danger', onClick: () => void erase() })]),
    ]),
  ]);
  return () => {
    unsubscribe();
    stopSession();
    root.replaceChildren();
  };
}
