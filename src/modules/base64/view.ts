import '../tools.css';
import { bytesToBase64, isBase64Error } from '../../../shared/bytes';
import { el, replaceChildren } from '../../core/dom';
import { formatBytes } from '../../core/format';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, copyToClipboard, downloadBlob, dropZone, field, moduleHeader, segmented, toast } from '../../core/ui';
import { decodeFile, decodeText, encodeText, toDataUrl } from './convert';

type Direction = 'encode' | 'decode';

const PREVIEW_LIMIT = 200_000;

export function mount(root: HTMLElement, context: ModuleContext): Unmount {
  const mode = context.path[0] === 'files' ? 'files' : 'text';
  root.append(
    moduleHeader({ title: 'Base64', subtitle: 'Encode and decode text or files. UTF-8 safe, URL-safe variant, and data URLs.' }, 'Base64 mode', [
      { label: 'Text', href: '#/base64', active: mode === 'text' },
      { label: 'Files', href: '#/base64/files', active: mode === 'files' },
    ]),
    mode === 'files' ? el('div', { class: 'stack-lg' }, [fileToBase64Panel(), base64ToFilePanel()]) : textPanel(context.query.token ?? ''),
  );
  return () => root.replaceChildren();
}

function textPanel(token: string): HTMLElement {
  let direction: Direction = token ? 'decode' : 'encode';
  const input = el('textarea', { class: 'input mono', attrs: { rows: 8, placeholder: 'Type or paste text', 'aria-label': 'Input', spellcheck: 'false' } });
  const output = el('textarea', { class: 'input mono', attrs: { rows: 8, readonly: true, 'aria-label': 'Output' } });
  const urlSafe = el('input', { attrs: { type: 'checkbox' } });
  const status = el('p', { class: 'tool-status', attrs: { role: 'status' } });

  const convert = (): void => {
    status.textContent = '';
    if (direction === 'encode') {
      output.value = encodeText(input.value, urlSafe.checked);
      return;
    }
    const result = decodeText(input.value);
    output.value = result.ok ? result.value : '';
    status.dataset.tone = 'error';
    status.textContent = result.ok || !input.value.trim() ? '' : result.error;
  };

  const directionControl = (): HTMLFieldSetElement =>
    segmented<Direction>('Direction', [{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }], direction, (next) => {
      direction = next;
      input.placeholder = next === 'encode' ? 'Type or paste text' : 'Paste Base64 or a data URL';
      convert();
    });
  const controls = el('div', { class: 'toolbar' }, [directionControl()]);

  const swap = (): void => {
    input.value = output.value;
    direction = direction === 'encode' ? 'decode' : 'encode';
    replaceChildren(controls, [directionControl(), urlSafeLabel]);
    convert();
  };

  const urlSafeLabel = el('label', { class: 'check' }, [urlSafe, el('span', { text: 'URL-safe' })]);
  controls.append(urlSafeLabel);
  input.addEventListener('input', convert);
  urlSafe.addEventListener('change', convert);

  // A shared link opens this tab in decode mode with the value filled in.
  const shareLink = (): void => {
    const encoded = (direction === 'encode' ? output.value : input.value).trim();
    if (!encoded) {
      toast(direction === 'encode' ? 'Type text to encode first.' : 'Paste Base64 to share first.', 'error');
      return;
    }
    const check = decodeText(encoded);
    if (!check.ok) {
      toast(check.error, 'error');
      return;
    }
    void copyToClipboard(`${window.location.origin}${window.location.pathname}#/base64?token=${encodeURIComponent(encoded)}`);
  };
  if (token) {
    input.value = token;
    input.placeholder = 'Paste Base64 or a data URL';
    convert();
  }

  return el('section', { class: 'card tool-panel stack' }, [
    controls,
    field('Input', input),
    el('div', { class: 'output-head' }, [
      el('span', { class: 'field-label', text: 'Output' }),
      el('div', { class: 'row' }, [
        button({ label: 'Swap input and output', icon: 'swap', iconOnly: true, variant: 'ghost', onClick: swap }),
        button({ label: 'Copy output', icon: 'copy', iconOnly: true, variant: 'ghost', onClick: () => void copyToClipboard(output.value) }),
        button({ label: 'Copy decode link', icon: 'external', iconOnly: true, variant: 'ghost', onClick: shareLink }),
      ]),
    ]),
    output,
    status,
  ]);
}

function fileToBase64Panel(): HTMLElement {
  let base64 = '';
  let mimeType = '';
  const asDataUrl = el('input', { attrs: { type: 'checkbox' } });
  const output = el('textarea', { class: 'input mono', attrs: { rows: 6, readonly: true, 'aria-label': 'Base64 output' } });
  const meta = el('p', { class: 'tool-status' });
  const preview = el('div', { class: 'preview', attrs: { hidden: true } });
  const result = (): string => (asDataUrl.checked ? toDataUrl(base64, mimeType) : base64);

  const show = (): void => {
    const text = result();
    output.value = text.length > PREVIEW_LIMIT ? `${text.slice(0, PREVIEW_LIMIT)}…` : text;
  };

  const load = async (file: File): Promise<void> => {
    base64 = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
    mimeType = file.type;
    meta.textContent = `${file.name} · ${formatBytes(file.size)} → ${formatBytes(base64.length)} of Base64${base64.length > PREVIEW_LIMIT ? ' (preview truncated, copy or download for the full text)' : ''}`;
    preview.hidden = !mimeType.startsWith('image/');
    replaceChildren(preview, preview.hidden ? [] : [el('img', { attrs: { src: toDataUrl(base64, mimeType), alt: `Preview of ${file.name}` } })]);
    show();
  };
  asDataUrl.addEventListener('change', show);

  return el('section', { class: 'card tool-panel stack' }, [
    el('h2', { class: 'section-title', text: 'File to Base64' }),
    dropZone('Drop a file or click to browse', 'Any file type', (file) => void load(file)),
    meta,
    preview,
    el('div', { class: 'output-head' }, [
      el('label', { class: 'check' }, [asDataUrl, el('span', { text: 'Data URL' })]),
      el('div', { class: 'row' }, [
        button({ label: 'Copy', icon: 'copy', variant: 'ghost', onClick: () => void copyToClipboard(result()) }),
        button({ label: 'Download .txt', icon: 'download', variant: 'ghost', onClick: () => downloadBlob(new Blob([result()], { type: 'text/plain' }), 'base64.txt') }),
      ]),
    ]),
    output,
  ]);
}

function base64ToFilePanel(): HTMLElement {
  const input = el('textarea', { class: 'input mono', attrs: { rows: 6, placeholder: 'Paste Base64 or a data URL', 'aria-label': 'Base64 input', spellcheck: 'false' } });
  const name = el('input', { class: 'input', attrs: { value: 'decoded.bin', 'aria-label': 'File name' } });
  const status = el('p', { class: 'tool-status', attrs: { role: 'status' } });
  const save = (): void => {
    try {
      const file = decodeFile(input.value);
      downloadBlob(new Blob([file.bytes], { type: file.mimeType }), name.value.trim() || 'decoded.bin');
      status.dataset.tone = 'ok';
      status.textContent = `Decoded ${formatBytes(file.bytes.length)} (${file.mimeType}).`;
    } catch (error) {
      status.dataset.tone = 'error';
      status.textContent = isBase64Error(error) ? error.message : 'Unable to decode this input.';
    }
  };
  return el('section', { class: 'card tool-panel stack' }, [
    el('h2', { class: 'section-title', text: 'Base64 to file' }),
    field('Base64', input),
    el('div', { class: 'row' }, [field('File name', name), button({ label: 'Download file', icon: 'download', variant: 'primary', onClick: save })]),
    status,
  ]);
}
