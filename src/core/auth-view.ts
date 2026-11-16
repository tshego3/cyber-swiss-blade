import { MIN_PASSWORD_LENGTH } from '../../shared/auth';
import { errorMessage, fetchStatus, loadApiConfig, normalizeBaseUrl } from './api';
import { el, replaceChildren } from './dom';
import { icon } from './icons';
import { getSession, setupAdministrator, signIn } from './session';
import type { Unmount } from './types';
import { button, field, formValue } from './ui';

export interface SignInOptions {
  readonly onSignedIn: () => void;
  readonly message?: string;
}

function input(name: string, type: string, attrs: Readonly<Record<string, string | number | boolean>> = {}): HTMLInputElement {
  return el('input', { class: 'input', attrs: { name, type, required: true, autocomplete: 'off', ...attrs } });
}

function statusLine(): HTMLParagraphElement {
  return el('p', { class: 'tool-status', attrs: { role: 'status', 'aria-live': 'polite' } });
}

function setStatus(line: HTMLParagraphElement, message: string, tone: 'info' | 'error' = 'info'): void {
  line.textContent = message;
  line.dataset.tone = tone;
}

function setBusy(form: HTMLFormElement, busy: boolean): void {
  for (const control of form.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input')) control.disabled = busy;
}

export function mountSignIn(root: HTMLElement, options: SignInOptions): Unmount {
  let disposed = false;
  const card = el('section', { class: 'card auth-card stack' });
  replaceChildren(root, [el('div', { class: 'auth-page' }, [card])]);

  const showSignIn = async (): Promise<void> => {
    const config = await loadApiConfig();
    if (disposed) return;
    const status = statusLine();
    const form = el('form', { class: 'stack', attrs: { novalidate: true } }, [
      field('Server URL', input('baseUrl', 'url', { value: config?.baseUrl ?? '', placeholder: 'https://cyber-swiss-blade-api.you.workers.dev' }), 'Your Cloudflare Worker address.'),
      field('Username', input('username', 'text', { value: getSession()?.user.username ?? '', autocomplete: 'username', autocapitalize: 'none' })),
      field('Password', input('password', 'password', { autocomplete: 'current-password' })),
      status,
      button({ label: 'Sign in', icon: 'check', variant: 'primary', type: 'submit' }),
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (form.reportValidity()) void submitSignIn(form, status);
    });
    replaceChildren(card, [heading('Sign in', options.message ?? 'Sign in to use Timesheet and Quotations. Your data syncs to your team database.'), form]);
    form.querySelector<HTMLInputElement>(config ? 'input[name=username]' : 'input[name=baseUrl]')?.focus();
  };

  const submitSignIn = async (form: HTMLFormElement, status: HTMLParagraphElement): Promise<void> => {
    const baseUrl = normalizeBaseUrl(formValue(form, 'baseUrl'));
    const username = formValue(form, 'username');
    const password = new FormData(form).get('password')?.toString() ?? '';
    if (!baseUrl) return setStatus(status, 'Use an https:// address.', 'error');
    setBusy(form, true);
    setStatus(status, 'Checking your details...');
    try {
      const server = await fetchStatus(baseUrl);
      if (server.setupRequired) return showSetup(baseUrl);
      await signIn(baseUrl, username, password);
      if (!disposed) options.onSignedIn();
    } catch (error) {
      setStatus(status, errorMessage(error, 'Could not sign in.'), 'error');
    } finally {
      setBusy(form, false);
    }
  };

  const showSetup = (baseUrl: string): void => {
    if (disposed) return;
    const status = statusLine();
    const form = el('form', { class: 'stack', attrs: { novalidate: true } }, [
      field('Setup key', input('setupKey', 'password'), 'The API_TOKEN secret that you put in Cloudflare.'),
      field('Username', input('username', 'text', { value: 'admin', autocomplete: 'username', autocapitalize: 'none', pattern: '[a-z0-9][a-z0-9._\\-]{1,31}' }), 'Lowercase letters, digits, dots, dashes, or underscores.'),
      field('Display name', input('displayName', 'text', { autocomplete: 'name' })),
      field('Password', input('password', 'password', { minlength: MIN_PASSWORD_LENGTH, autocomplete: 'new-password' }), `At least ${MIN_PASSWORD_LENGTH} characters.`),
      field('Confirm password', input('confirm', 'password', { minlength: MIN_PASSWORD_LENGTH, autocomplete: 'new-password' })),
      status,
      el('div', { class: 'row' }, [
        button({ label: 'Create administrator', icon: 'check', variant: 'primary', type: 'submit' }),
        button({ label: 'Back', variant: 'ghost', onClick: () => void showSignIn() }),
      ]),
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (form.reportValidity()) void submitSetup(baseUrl, form, status);
    });
    replaceChildren(card, [heading('Create the administrator', 'This server has no users yet. Enter the setup key to create the first administrator account.'), form]);
    form.querySelector<HTMLInputElement>('input[name=setupKey]')?.focus();
  };

  const submitSetup = async (baseUrl: string, form: HTMLFormElement, status: HTMLParagraphElement): Promise<void> => {
    const data = new FormData(form);
    const password = data.get('password')?.toString() ?? '';
    const input = { setupKey: formValue(form, 'setupKey'), username: formValue(form, 'username'), displayName: formValue(form, 'displayName'), password };
    if (password !== data.get('confirm')?.toString()) return setStatus(status, 'The passwords do not match.', 'error');
    setBusy(form, true);
    setStatus(status, 'Creating the administrator...');
    try {
      await setupAdministrator(baseUrl, input);
      if (!disposed) options.onSignedIn();
    } catch (error) {
      setStatus(status, errorMessage(error, 'Could not create the administrator.'), 'error');
    } finally {
      setBusy(form, false);
    }
  };

  void showSignIn();
  return () => {
    disposed = true;
    root.replaceChildren();
  };
}

function heading(title: string, text: string): HTMLElement {
  return el('header', { class: 'auth-heading' }, [el('span', { class: 'tool-icon' }, [icon('lock', 20)]), el('h1', { class: 'page-title', text: title }), el('p', { class: 'muted', text })]);
}

export function mountNoAccess(root: HTMLElement, title: string): Unmount {
  replaceChildren(root, [
    el('div', { class: 'state state-empty' }, [
      el('span', { class: 'state-icon' }, [icon('lock', 22)]),
      el('p', { class: 'state-title', text: `You do not have access to ${title}` }),
      el('p', { class: 'state-text', text: 'Ask an administrator to give one of your roles View permission.' }),
    ]),
  ]);
  return () => root.replaceChildren();
}
