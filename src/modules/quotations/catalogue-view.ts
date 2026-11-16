import { onDataChange } from '../../core/db';
import { el, replaceChildren } from '../../core/dom';
import { formatMoney } from '../../core/format';
import type { Entity } from '../../core/repository';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, emptyState, errorState, field, formValue, loadingState, openFormDialog } from '../../core/ui';
import { catalogue } from './data';
import { quotationHeader } from './header';
import { QUOTATION_COLLECTIONS, type CatalogueItem } from './types';

const CURRENCY = 'ZAR';

export function mountCatalogue(root: HTMLElement, context: ModuleContext): Unmount {
  const content = el('div', { class: 'stack-lg' });

  const load = async (): Promise<void> => {
    try {
      render(await catalogue.list());
    } catch (error) {
      console.error('Catalogue failed to load', error);
      replaceChildren(content, [errorState('Unable to load the catalogue.', () => void load())]);
    }
  };

  const render = (items: readonly Entity<CatalogueItem>[]): void => {
    if (items.length === 0) {
      replaceChildren(content, [emptyState({ icon: 'folder', title: 'No catalogue items', text: 'Add your services, packages, and extras such as transport or delivery. Then add them to quotes in one click.' })]);
      return;
    }
    const categories = [...new Set(items.map((item) => item.category || 'Other'))].sort();
    replaceChildren(
      content,
      categories.map((category) =>
        el('section', { class: 'stack' }, [
          el('h2', { class: 'section-title', text: category }),
          el(
            'ul',
            { class: 'card-grid' },
            items
              .filter((item) => (item.category || 'Other') === category)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((item) =>
                el('li', { class: `card item-card${item.archived ? ' is-archived' : ''}` }, [
                  el('div', {}, [el('h3', { class: 'item-name', text: item.name }), item.description && el('p', { class: 'muted small', text: item.description })]),
                  el('p', { class: 'mono', text: `${formatMoney(item.unitPrice, CURRENCY)}${item.unit ? ` / ${item.unit}` : ''}` }),
                  context.canEdit &&
                    el('div', { class: 'row' }, [
                      button({ label: 'Edit', icon: 'edit', variant: 'ghost', onClick: () => openItemDialog(item) }),
                      button({ label: item.archived ? 'Restore' : 'Archive', variant: 'ghost', onClick: () => void catalogue.save({ ...item, archived: !item.archived }, item.id) }),
                    ]),
                ]),
              ),
          ),
        ]),
      ),
    );
  };

  root.append(quotationHeader('catalogue', context.canEdit ? [button({ label: 'New item', icon: 'plus', variant: 'primary', onClick: () => openItemDialog() })] : []), content);
  replaceChildren(content, [loadingState('Loading catalogue')]);
  void load();
  const stop = onDataChange((collection) => {
    if (collection === QUOTATION_COLLECTIONS.catalogue) void load();
  });
  return () => {
    stop();
    root.replaceChildren();
  };
}

function openItemDialog(item?: Entity<CatalogueItem>): void {
  const input = (name: 'category' | 'name' | 'description' | 'unit', attrs: Readonly<Record<string, string | boolean>> = {}): HTMLInputElement =>
    el('input', { class: 'input', attrs: { name, value: item?.[name] ?? '', autocomplete: 'off', maxlength: 120, ...attrs } });
  openFormDialog({
    title: item ? 'Edit item' : 'New catalogue item',
    submitLabel: item ? 'Save' : 'Add item',
    body: [
      el('div', { class: 'grid-2' }, [field('Category', input('category', { placeholder: 'Videography' })), field('Name', input('name', { required: true, placeholder: 'Music video' }))]),
      field('Description', input('description', { placeholder: 'Optional. Printed on the line.' })),
      el('div', { class: 'grid-2' }, [
        field('Unit price (excl. VAT)', el('input', { class: 'input mono', attrs: { name: 'unitPrice', type: 'number', step: '0.01', required: true, value: item?.unitPrice ?? 0 } })),
        field('Unit', input('unit', { placeholder: 'each, hour, day, km' })),
      ]),
    ],
    onSubmit: async (form) => {
      await catalogue.save(
        {
          category: formValue(form, 'category'),
          name: formValue(form, 'name'),
          description: formValue(form, 'description'),
          unit: formValue(form, 'unit'),
          unitPrice: Number(formValue(form, 'unitPrice')) || 0,
          archived: item?.archived ?? false,
        },
        item?.id,
      );
      return true;
    },
  });
}
