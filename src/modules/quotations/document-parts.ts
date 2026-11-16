import { el, replaceChildren } from '../../core/dom';
import { formatMoney } from '../../core/format';
import type { Entity } from '../../core/repository';
import { button } from '../../core/ui';
import { createLine, documentTotals, lineAmount } from './data';
import type { CatalogueItem, PricedDocument, QuoteLine } from './types';

export interface LinesEditor {
  readonly element: HTMLElement;
  readonly setCurrency: (currency: string) => void;
}

export interface LinesEditorOptions {
  readonly lines: readonly QuoteLine[];
  readonly currency: string;
  readonly catalogue: readonly Entity<CatalogueItem>[];
  readonly disabled: boolean;
  readonly onChange: (lines: readonly QuoteLine[]) => void;
}

const FIELD_LABELS = { description: 'Description', quantity: 'Quantity', unit: 'Unit', unitPrice: 'Unit price', discountPercent: 'Discount %' } as const;

export function linesEditor(options: LinesEditorOptions): LinesEditor {
  let lines = [...options.lines];
  let currency = options.currency;
  const list = el('ol', { class: 'lines' });

  const commit = (): void => options.onChange(lines);

  const row = (line: QuoteLine): HTMLLIElement => {
    const amount = el('span', { class: 'line-amount mono', text: formatMoney(lineAmount(line), currency) });
    const input = (name: keyof typeof FIELD_LABELS, attrs: Readonly<Record<string, string | number>>): HTMLInputElement =>
      el('input', { class: `input${name === 'description' || name === 'unit' ? '' : ' mono'}`, attrs: { 'data-field': name, 'aria-label': FIELD_LABELS[name], disabled: options.disabled, ...attrs } });
    const description = input('description', { value: line.description, placeholder: 'Describe the work' });
    const quantity = input('quantity', { type: 'number', step: 'any', value: line.quantity });
    const unit = input('unit', { value: line.unit, placeholder: 'each', maxlength: 16 });
    const unitPrice = input('unitPrice', { type: 'number', step: '0.01', value: line.unitPrice });
    const discount = input('discountPercent', { type: 'number', min: 0, max: 100, step: '0.01', value: line.discountPercent });
    const caption = (text: string, control: HTMLInputElement): HTMLLabelElement => el('label', { class: 'line-field' }, [el('span', { class: 'line-caption', text }), control]);
    const item = el('li', { class: 'line-row' }, [
      description,
      caption('Qty', quantity),
      caption('Unit', unit),
      caption('Price', unitPrice),
      caption('Disc %', discount),
      amount,
      !options.disabled && button({ label: 'Remove line', icon: 'close', iconOnly: true, variant: 'ghost', onClick: () => {
        lines = lines.filter((candidate) => candidate.id !== line.id);
        commit();
        render();
      } }),
    ]);
    item.addEventListener('input', () => {
      const changed: QuoteLine = {
        ...line,
        description: description.value,
        quantity: Number(quantity.value) || 0,
        unit: unit.value.trim(),
        unitPrice: Number(unitPrice.value) || 0,
        discountPercent: Math.min(100, Math.max(0, Number(discount.value) || 0)),
      };
      amount.textContent = formatMoney(lineAmount(changed), currency);
      lines = lines.map((candidate) => (candidate.id === line.id ? changed : candidate));
      commit();
    });
    return item;
  };

  const add = (line: QuoteLine): void => {
    lines = [...lines, line];
    commit();
    render();
    list.querySelector<HTMLInputElement>('li:last-child [data-field="description"]')?.focus();
  };

  const render = (): void => replaceChildren(list, lines.map(row));

  const active = options.catalogue.filter((item) => !item.archived);
  const picker =
    active.length > 0 &&
    el('select', { class: 'input catalogue-picker', attrs: { 'aria-label': 'Add from catalogue', disabled: options.disabled } }, [
      el('option', { text: 'Add from catalogue…', attrs: { value: '' } }),
      ...[...new Set(active.map((item) => item.category || 'Other'))].sort().map((category) =>
        el(
          'optgroup',
          { attrs: { label: category } },
          active.filter((item) => (item.category || 'Other') === category).map((item) => el('option', { text: `${item.name} · ${formatMoney(item.unitPrice, currency)}${item.unit ? ` / ${item.unit}` : ''}`, attrs: { value: item.id } })),
        ),
      ),
    ]);
  if (picker) {
    picker.addEventListener('change', () => {
      const item = active.find((candidate) => candidate.id === picker.value);
      picker.value = '';
      if (item) add(createLine(item));
    });
  }

  render();
  const element = el('section', { class: 'card stack' }, [
    el('div', { class: 'lines-head' }, [el('h2', { class: 'section-title', text: 'Line items' }), el('span', { class: 'muted', text: 'Qty × unit price, less line discount' })]),
    el('div', { class: 'line-labels muted', attrs: { 'aria-hidden': 'true' } }, ['Qty', 'Unit', 'Price', 'Disc %', 'Amount'].map((label) => el('span', { text: label }))),
    list,
    !options.disabled && el('div', { class: 'row' }, [button({ label: 'Add line', icon: 'plus', variant: 'ghost', onClick: () => add(createLine()) }), picker]),
  ]);
  return {
    element,
    setCurrency(next) {
      currency = next;
      render();
    },
  };
}

export function renderTotals(target: HTMLElement, document: PricedDocument, currency: string, extra: readonly (readonly [string, number])[] = []): void {
  const { subtotal, discount, tax, total } = documentTotals(document);
  const row = (label: string, amount: number, strong = false): HTMLElement =>
    el('div', { class: `total-row${strong ? ' is-total' : ''}` }, [el('dt', { text: label }), el('dd', { class: 'mono', text: formatMoney(amount, currency) })]);
  replaceChildren(target, [
    row('Subtotal', subtotal),
    discount > 0 && row(`Discount (${document.discountPercent}%)`, -discount),
    row(`VAT (${document.taxRate}%)`, tax),
    row('Total', total, true),
    ...extra.map(([label, amount]) => row(label, amount)),
  ]);
}

export function readNumber(form: HTMLFormElement, name: string, fallback: number, min = 0, max = 100): number {
  const element = form.elements.namedItem(name);
  const value = element instanceof HTMLInputElement ? Number(element.value) : Number.NaN;
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export function readText(form: HTMLFormElement, name: string): string {
  const element = form.elements.namedItem(name);
  return element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement ? element.value : '';
}

export function readChecked(form: HTMLFormElement, name: string): boolean {
  const element = form.elements.namedItem(name);
  return element instanceof HTMLInputElement && element.checked;
}

export function createAutosave(delayMs: number): { readonly schedule: (save: () => Promise<void>) => void; readonly cancel: () => void; readonly flush: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: (() => Promise<void>) | null = null;
  const flush = (): void => {
    clearTimeout(timer);
    if (pending) void pending();
    pending = null;
  };
  return {
    schedule(save) {
      pending = save;
      clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
    cancel() {
      clearTimeout(timer);
      pending = null;
    },
    flush,
  };
}
