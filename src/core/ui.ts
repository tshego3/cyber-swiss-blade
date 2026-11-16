import { append, el, type Child } from './dom';
import { icon, type IconName } from './icons';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ToastTone = 'info' | 'success' | 'error';

export interface ButtonOptions {
  readonly label: string;
  readonly icon?: IconName;
  readonly variant?: ButtonVariant;
  readonly iconOnly?: boolean;
  readonly type?: 'button' | 'submit';
  readonly disabled?: boolean;
  readonly onClick?: (event: MouseEvent) => void;
}

export interface Option<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface FormDialogOptions {
  readonly title: string;
  readonly body: readonly Child[];
  readonly submitLabel: string;
  readonly danger?: boolean;
  readonly onSubmit: (form: HTMLFormElement) => boolean | Promise<boolean>;
  readonly onClose?: (submitted: boolean) => void;
}

export interface EmptyStateOptions {
  readonly icon: IconName;
  readonly title: string;
  readonly text: string;
  readonly action?: HTMLElement;
}

export interface PageHeaderOptions {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: readonly Child[];
}

export interface TabLink {
  readonly label: string;
  readonly href: string;
  readonly active: boolean;
}

export function button(options: ButtonOptions): HTMLButtonElement {
  const variant = options.variant ?? 'secondary';
  return el(
    'button',
    {
      class: `button button-${variant}${options.iconOnly ? ' button-icon' : ''}`,
      attrs: {
        type: options.type ?? 'button',
        disabled: options.disabled,
        'aria-label': options.iconOnly ? options.label : undefined,
        title: options.iconOnly ? options.label : undefined,
      },
      on: options.onClick ? { click: options.onClick } : {},
    },
    [options.icon && icon(options.icon), !options.iconOnly && el('span', { text: options.label })],
  );
}

export function field(label: string, control: HTMLElement, hint?: string): HTMLLabelElement {
  return el('label', { class: 'field' }, [el('span', { class: 'field-label', text: label }), control, hint && el('span', { class: 'field-hint', text: hint })]);
}

export function selectControl<T extends string>(name: string, options: readonly Option<T>[], selected: T | ''): HTMLSelectElement {
  return el(
    'select',
    { class: 'input', attrs: { name } },
    options.map((option) => el('option', { text: option.label, attrs: { value: option.value, selected: option.value === selected } })),
  );
}

export function segmented<T extends string>(label: string, options: readonly Option<T>[], selected: T, onChange: (value: T) => void): HTMLFieldSetElement {
  const name = `segment-${crypto.randomUUID()}`;
  return el('fieldset', { class: 'segmented' }, [
    el('legend', { class: 'visually-hidden', text: label }),
    ...options.map((option) =>
      el('label', { class: 'segment' }, [
        el('input', {
          attrs: { type: 'radio', name, value: option.value, checked: option.value === selected },
          on: { change: () => onChange(option.value) },
        }),
        el('span', { text: option.label }),
      ]),
    ),
  ]);
}

export function pageHeader(options: PageHeaderOptions): HTMLElement {
  return el('header', { class: 'page-header' }, [
    el('div', { class: 'page-heading' }, [el('h1', { class: 'page-title', text: options.title }), options.subtitle && el('p', { class: 'page-subtitle', text: options.subtitle })]),
    options.actions && el('div', { class: 'page-actions' }, options.actions),
  ]);
}

export function tabs(label: string, links: readonly TabLink[]): HTMLElement {
  return el(
    'nav',
    { class: 'tabs', attrs: { 'aria-label': label } },
    links.map((link) => el('a', { class: 'tab', text: link.label, attrs: { href: link.href, 'aria-current': link.active ? 'page' : undefined } })),
  );
}

export function moduleHeader(header: PageHeaderOptions, label: string, links: readonly TabLink[]): HTMLElement {
  return el('div', { class: 'module-header' }, [pageHeader(header), tabs(label, links)]);
}

export function loadingState(label = 'Loading'): HTMLElement {
  return el('div', { class: 'state state-loading', attrs: { role: 'status' } }, [el('span', { class: 'spinner', attrs: { 'aria-hidden': 'true' } }), el('span', { text: label })]);
}

export function errorState(message: string, retry: () => void): HTMLElement {
  return el('div', { class: 'state state-error', attrs: { role: 'alert' } }, [
    el('p', { class: 'state-title', text: message }),
    button({ label: 'Try again', icon: 'refresh', onClick: retry }),
  ]);
}

export function emptyState(options: EmptyStateOptions): HTMLElement {
  return el('div', { class: 'state state-empty' }, [
    el('span', { class: 'state-icon' }, [icon(options.icon, 22)]),
    el('p', { class: 'state-title', text: options.title }),
    el('p', { class: 'state-text', text: options.text }),
    options.action,
  ]);
}

export function toast(message: string, tone: ToastTone = 'info'): void {
  const region = document.querySelector('.toast-region') ?? document.body.appendChild(el('div', { class: 'toast-region', attrs: { 'aria-live': 'polite' } }));
  const item = el('div', { class: `toast toast-${tone}`, text: message, attrs: { role: tone === 'error' ? 'alert' : 'status' } });
  region.append(item);
  setTimeout(() => item.remove(), 4_000);
}

export function openFormDialog(options: FormDialogOptions): HTMLDialogElement {
  let submitted = false;
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const form = el('form', { class: 'dialog-form', attrs: { novalidate: true } });
  const dialog = el('dialog', { class: 'dialog', attrs: { 'aria-label': options.title } }, [form]);
  const close = (): void => dialog.close();
  append(form, [
    el('header', { class: 'dialog-header' }, [el('h2', { class: 'dialog-title', text: options.title }), button({ label: 'Close', icon: 'close', iconOnly: true, variant: 'ghost', onClick: close })]),
    el('div', { class: 'dialog-body' }, options.body),
    el('footer', { class: 'dialog-footer' }, [
      button({ label: 'Cancel', variant: 'ghost', onClick: close }),
      button({ label: options.submitLabel, type: 'submit', variant: options.danger ? 'danger' : 'primary' }),
    ]),
  ]);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    void Promise.resolve(options.onSubmit(form)).then((done) => {
      submitted = done;
      if (done) close();
    });
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    options.onClose?.(submitted);
    if (!opener?.isConnected) document.getElementById('main')?.focus();
  });
  document.body.append(dialog);
  dialog.showModal();
  form.querySelector<HTMLElement>('.dialog-body input, .dialog-body select, .dialog-body textarea')?.focus();
  return dialog;
}

export function confirmAction(title: string, message: string, confirmLabel: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    openFormDialog({
      title,
      body: [el('p', { class: 'dialog-text', text: message })],
      submitLabel: confirmLabel,
      danger: true,
      onSubmit: () => true,
      onClose: resolve,
    });
  });
}

export function dropZone(label: string, hint: string, onFile: (file: File) => void): HTMLLabelElement {
  const input = el('input', { class: 'visually-hidden', attrs: { type: 'file' } });
  const zone = el('label', { class: 'dropzone' }, [input, icon('upload', 22), el('span', { class: 'dropzone-label', text: label }), el('span', { class: 'dropzone-hint', text: hint })]);
  const pick = (file: File | undefined): void => {
    if (file) onFile(file);
  };
  input.addEventListener('change', () => pick(input.files?.[0]));
  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.classList.add('is-dragging');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('is-dragging'));
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('is-dragging');
    pick(event.dataTransfer?.files[0]);
  });
  return zone;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = el('a', { attrs: { href: url, download: filename } });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied to clipboard', 'success');
  } catch {
    toast('Clipboard access was blocked by the browser.', 'error');
  }
}

export function formValue(form: HTMLFormElement, name: string): string {
  const value = new FormData(form).get(name);
  return typeof value === 'string' ? value.trim() : '';
}

export function formChecked(form: HTMLFormElement, name: string): boolean {
  return new FormData(form).get(name) !== null;
}
