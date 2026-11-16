import { el, replaceChildren } from '../../core/dom';
import type { Unmount } from '../../core/types';
import { button, errorState, field, formValue, loadingState, toast } from '../../core/ui';
import { loadProfile, saveProfile } from './data';
import { quotationHeader } from './header';
import type { BusinessProfile } from './types';

export function mountProfile(root: HTMLElement): Unmount {
  const content = el('div');
  root.append(quotationHeader('profile', []), content);

  const load = async (): Promise<void> => {
    replaceChildren(content, [loadingState('Loading profile')]);
    try {
      replaceChildren(content, [profileForm(await loadProfile())]);
    } catch (error) {
      console.error('Profile failed to load', error);
      replaceChildren(content, [errorState('Unable to load your business profile.', () => void load())]);
    }
  };

  void load();
  return () => root.replaceChildren();
}

function profileForm(profile: BusinessProfile): HTMLFormElement {
  const input = (name: keyof BusinessProfile, attrs: Readonly<Record<string, string>> = {}): HTMLInputElement =>
    el('input', { class: 'input', attrs: { name, value: profile[name], autocomplete: 'off', ...attrs } });
  const textarea = (name: keyof BusinessProfile): HTMLTextAreaElement => el('textarea', { class: 'input', text: profile[name], attrs: { name, rows: 3 } });
  const form = el('form', { class: 'card stack narrow', attrs: { 'aria-label': 'Business profile' } }, [
    el('p', { class: 'muted', text: 'Printed at the top of every quote.' }),
    field('Business name', input('name')),
    el('div', { class: 'grid-2' }, [field('Email', input('email', { type: 'email' })), field('Phone', input('phone', { type: 'tel' }))]),
    field('Address', textarea('address')),
    field('Tax / VAT number', input('taxNumber')),
    field('Payment terms', textarea('paymentTerms'), 'e.g. 50% deposit, balance within 14 days.'),
    el('div', { class: 'row' }, [button({ label: 'Save profile', icon: 'check', variant: 'primary', type: 'submit' })]),
  ]);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const next: BusinessProfile = {
      name: formValue(form, 'name'),
      email: formValue(form, 'email'),
      phone: formValue(form, 'phone'),
      address: formValue(form, 'address'),
      taxNumber: formValue(form, 'taxNumber'),
      paymentTerms: formValue(form, 'paymentTerms'),
    };
    void saveProfile(next).then(() => toast('Profile saved', 'success'));
  });
  return form;
}
