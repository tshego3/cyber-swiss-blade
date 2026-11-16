import { el, replaceChildren } from '../../core/dom';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, errorState, field, formChecked, formValue, loadingState, toast } from '../../core/ui';
import { loadProfile, saveProfile } from './data';
import { quotationHeader } from './header';
import type { BusinessProfile } from './types';

const MAX_LOGO_BYTES = 200 * 1024;

type TextKey = { [K in keyof BusinessProfile]: BusinessProfile[K] extends string ? K : never }[keyof BusinessProfile];

export function mountProfile(root: HTMLElement, context: ModuleContext): Unmount {
  const content = el('div');
  root.append(quotationHeader('profile', []), content);

  const load = async (): Promise<void> => {
    replaceChildren(content, [loadingState('Loading profile')]);
    try {
      replaceChildren(content, [profileForm(await loadProfile(), !context.canEdit)]);
    } catch (error) {
      console.error('Profile failed to load', error);
      replaceChildren(content, [errorState('Unable to load your business profile.', () => void load())]);
    }
  };

  void load();
  return () => root.replaceChildren();
}

function readLogo(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.size > MAX_LOGO_BYTES) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function profileForm(profile: BusinessProfile, disabled: boolean): HTMLFormElement {
  let logo = profile.logo;
  const input = (name: TextKey, attrs: Readonly<Record<string, string>> = {}): HTMLInputElement =>
    el('input', { class: 'input', attrs: { name, value: profile[name], autocomplete: 'off', disabled, ...attrs } });
  const number = (name: 'depositPercent' | 'paymentDays', max: number): HTMLInputElement =>
    el('input', { class: 'input mono', attrs: { name, type: 'number', min: 0, max, step: 1, value: profile[name], disabled } });
  const textarea = (name: TextKey, rows = 3): HTMLTextAreaElement => el('textarea', { class: 'input', text: profile[name], attrs: { name, rows, disabled } });

  const preview = el('img', { class: 'logo-preview', attrs: { alt: 'Logo preview', src: logo || undefined, hidden: !logo } });
  const logoInput = el('input', { class: 'input', attrs: { type: 'file', accept: 'image/png,image/jpeg,image/svg+xml,image/webp', disabled } });
  logoInput.addEventListener('change', () => {
    const file = logoInput.files?.[0];
    if (!file) return;
    void readLogo(file).then((dataUrl) => {
      if (!dataUrl) return toast('Use an image file of 200 KB or less.', 'error');
      logo = dataUrl;
      preview.src = dataUrl;
      preview.hidden = false;
    });
  });
  const removeLogo = button({ label: 'Remove logo', variant: 'ghost', disabled, onClick: () => {
    logo = '';
    preview.hidden = true;
    logoInput.value = '';
  } });

  const section = (title: string, children: readonly HTMLElement[]): HTMLElement => el('section', { class: 'card stack' }, [el('h2', { class: 'section-title', text: title }), ...children]);
  const form = el('form', { class: 'stack-lg narrow', attrs: { 'aria-label': 'Business profile', novalidate: true } }, [
    section('Business', [
      el('p', { class: 'muted', text: 'Printed at the top of every quote and invoice.' }),
      field('Business name', input('name')),
      el('div', { class: 'grid-2' }, [field('Email', input('email', { type: 'email' })), field('Phone', input('phone', { type: 'tel' }))]),
      field('Address', textarea('address')),
      el('div', { class: 'grid-2' }, [
        field('VAT number', input('taxNumber')),
        el('label', { class: 'check booking-check' }, [el('input', { attrs: { type: 'checkbox', name: 'vatRegistered', checked: profile.vatRegistered, disabled } }), el('span', { text: 'VAT registered (new quotes add 15% VAT)' })]),
      ]),
      field('Logo', logoInput, 'PNG, JPG, SVG, or WebP. 200 KB or less.'),
      el('div', { class: 'row' }, [preview, removeLogo]),
    ]),
    section('Banking details', [
      el('p', { class: 'muted', text: 'Printed on quotes and invoices so that clients can pay you.' }),
      el('div', { class: 'grid-2' }, [field('Bank', input('bankName')), field('Account holder', input('accountHolder'))]),
      el('div', { class: 'grid-2' }, [field('Account number', input('accountNumber')), field('Branch code', input('branchCode'))]),
      field('Payment reference', input('paymentReference', { placeholder: '{number} {client}' }), 'Use {number} for the document number and {client} for the client name.'),
    ]),
    section('Defaults', [
      el('div', { class: 'grid-2' }, [field('Deposit % on new quotes', number('depositPercent', 100)), field('Invoice due after (days)', number('paymentDays', 365))]),
      el('div', { class: 'grid-2' }, [field('Quote number prefix', input('quotePrefix', { maxlength: '8' })), field('Invoice number prefix', input('invoicePrefix', { maxlength: '8' }))]),
      field('Default terms and conditions', textarea('defaultTerms', 5), 'Copied to each new quote. For example: deposit rules, cancellation, delivery times.'),
      field('Payment terms', textarea('paymentTerms'), 'Printed when a document has no terms of its own.'),
    ]),
    !disabled ? el('div', { class: 'row' }, [button({ label: 'Save profile', icon: 'check', variant: 'primary', type: 'submit' })]) : el('span'),
  ]);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const whole = (name: string, fallback: number, max: number): number => {
      const value = Number(formValue(form, name));
      return Number.isFinite(value) && value >= 0 ? Math.min(max, Math.round(value)) : fallback;
    };
    const next: BusinessProfile = {
      name: formValue(form, 'name'),
      email: formValue(form, 'email'),
      phone: formValue(form, 'phone'),
      address: formValue(form, 'address'),
      taxNumber: formValue(form, 'taxNumber'),
      vatRegistered: formChecked(form, 'vatRegistered'),
      logo,
      paymentTerms: formValue(form, 'paymentTerms'),
      defaultTerms: formValue(form, 'defaultTerms'),
      depositPercent: whole('depositPercent', profile.depositPercent, 100),
      paymentDays: whole('paymentDays', profile.paymentDays, 365),
      quotePrefix: formValue(form, 'quotePrefix').toUpperCase() || 'Q',
      invoicePrefix: formValue(form, 'invoicePrefix').toUpperCase() || 'INV',
      bankName: formValue(form, 'bankName'),
      accountHolder: formValue(form, 'accountHolder'),
      accountNumber: formValue(form, 'accountNumber'),
      branchCode: formValue(form, 'branchCode'),
      paymentReference: formValue(form, 'paymentReference'),
    };
    void saveProfile(next).then(() => toast('Profile saved', 'success'));
  });
  return form;
}
