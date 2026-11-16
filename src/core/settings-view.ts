import { fetchStatus, isApiError, loadApiConfig, normalizeBaseUrl, saveApiConfig } from './api';
import { eraseAllData } from './db';
import { el, replaceChildren } from './dom';
import { describeSyncState } from './sync-status';
import type { SyncEngine } from './sync';
import { getThemePreference, setThemePreference } from './theme';
import type { ApiConfig, ThemePreference, Unmount } from './types';
import { button, confirmAction, field, formValue, pageHeader, segmented, toast } from './ui';

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

function syncForm(config: ApiConfig | null, sync: SyncEngine): HTMLFormElement {
  const form = el('form', { class: 'stack', attrs: { novalidate: true } }, [
    field('API URL', el('input', { class: 'input', attrs: { name: 'baseUrl', type: 'url', required: true, placeholder: 'https://cyber-swiss-blade-api.you.workers.dev', value: config?.baseUrl ?? '', autocomplete: 'off' } }), 'Your Cloudflare Worker address.'),
    field('API token', el('input', { class: 'input', attrs: { name: 'token', type: 'password', required: true, minlength: 32, value: config?.token ?? '', autocomplete: 'off' } }), 'The API_TOKEN secret you set with wrangler.'),
    el('div', { class: 'row' }, [
      button({ label: 'Save and sync', icon: 'check', variant: 'primary', type: 'submit' }),
      config && button({ label: 'Disconnect', variant: 'ghost', onClick: () => void disconnect(sync) }),
    ]),
  ]);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (form.reportValidity()) void connect(form, sync);
  });
  return form;
}

async function connect(form: HTMLFormElement, sync: SyncEngine): Promise<void> {
  const baseUrl = normalizeBaseUrl(formValue(form, 'baseUrl'));
  if (!baseUrl) {
    toast('Use an https:// address.', 'error');
    return;
  }
  const config: ApiConfig = { baseUrl, token: formValue(form, 'token') };
  try {
    const status = await fetchStatus(config);
    await saveApiConfig(config);
    toast(`Connected to ${status.database}`, 'success');
    await sync.syncNow();
  } catch (error) {
    toast(isApiError(error) ? error.message : 'Could not reach the sync server.', 'error');
  }
}

async function disconnect(sync: SyncEngine): Promise<void> {
  await saveApiConfig(null);
  await sync.syncNow();
  toast('Sync disconnected. Data stays on this device.');
}

async function erase(): Promise<void> {
  const confirmed = await confirmAction('Erase local data', 'This removes every record, pending change, and setting stored on this device. Synced data stays in MongoDB.', 'Erase');
  if (!confirmed) return;
  await eraseAllData();
  window.location.reload();
}

export function mountSettings(root: HTMLElement, sync: SyncEngine): Unmount {
  const status = el('p', { class: 'muted' });
  const unsubscribe = sync.subscribe((state) => {
    const view = describeSyncState(state);
    status.textContent = `${view.label}. ${view.detail}.`;
  });
  const syncBody = el('div', { class: 'stack' }, [status]);
  void loadApiConfig().then((config) => syncBody.append(syncForm(config, sync)));

  replaceChildren(root, [
    el('div', { class: 'module-header' }, [pageHeader({ title: 'Settings', subtitle: 'Sync, appearance, and local data.' })]),
    el('div', { class: 'stack-lg' }, [
      section('Sync', 'Timesheet and quotation data is stored on this device first and synced to MongoDB through your Cloudflare Worker.', [syncBody]),
      section('Appearance', 'Follow the system or pick a theme.', [segmented('Theme', THEME_OPTIONS, getThemePreference(), setThemePreference)]),
      section('Local data', 'Clear this device. Use it before handing over a shared machine.', [button({ label: 'Erase local data', icon: 'trash', variant: 'danger', onClick: () => void erase() })]),
    ]),
  ]);
  return () => {
    unsubscribe();
    root.replaceChildren();
  };
}
