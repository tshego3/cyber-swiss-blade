import '../tools.css';
import { el, replaceChildren } from '../../core/dom';
import { formatBytes } from '../../core/format';
import { icon } from '../../core/icons';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, copyToClipboard, downloadBlob, dropZone, field, moduleHeader, segmented } from '../../core/ui';
import { aesCryptFileName, decryptAesCrypt, encryptAesCrypt, isAesCrypt, plainFileName } from './aescrypt';
import { MIN_PASSWORD_LENGTH, type CryptoError, decryptBytes, decryptText, encryptBytes, encryptText, encryptedFileName, isCryptoError, isEncrypted } from './crypto';

type FileKind = 'plain' | 'csb' | 'aescrypt';
type OutputFormat = 'csb' | 'aescrypt';

interface SelectedFile {
  readonly name: string;
  readonly size: number;
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly kind: FileKind;
}

const KIND_LABELS: Readonly<Record<FileKind, string>> = { plain: 'Plain file', csb: 'Encrypted file (.csb)', aescrypt: 'Encrypted file (AES Crypt .aes)' };

function fileKind(bytes: Uint8Array): FileKind {
  if (isEncrypted(bytes)) return 'csb';
  return isAesCrypt(bytes) ? 'aescrypt' : 'plain';
}

export function mount(root: HTMLElement, context: ModuleContext): Unmount {
  const mode = context.path[0] === 'text' ? 'text' : 'file';
  root.append(
    moduleHeader({ title: 'AES Encryption', subtitle: 'AES-256-GCM with a PBKDF2-SHA256 key, or AES Crypt (.aes) files. Everything stays on this device.' }, 'Encryption mode', [
      { label: 'Files', href: '#/aes', active: mode === 'file' },
      { label: 'Text', href: '#/aes/text', active: mode === 'text' },
    ]),
    mode === 'text' ? textPanel() : filePanel(),
  );
  return () => root.replaceChildren();
}

function passwordInput(name: string, label: string): HTMLInputElement {
  return el('input', { class: 'input', attrs: { name, type: 'password', autocomplete: 'new-password', minlength: MIN_PASSWORD_LENGTH, 'aria-label': label } });
}

function messageFor(error: unknown): string {
  if (isCryptoError(error)) return error.message;
  console.error('Encryption failed', error);
  return 'Something went wrong. Please try again.';
}

async function runBusy(action: HTMLButtonElement, status: HTMLElement, task: () => Promise<string>): Promise<void> {
  action.disabled = true;
  status.dataset.tone = 'muted';
  status.textContent = 'Deriving key and processing…';
  try {
    status.textContent = await task();
    status.dataset.tone = 'ok';
  } catch (error) {
    status.textContent = messageFor(error);
    status.dataset.tone = 'error';
  } finally {
    action.disabled = false;
  }
}

const mismatch: CryptoError = { type: 'weak-password', message: 'The passwords do not match.' };

function filePanel(): HTMLElement {
  let selected: SelectedFile | null = null;
  let format: OutputFormat = 'csb';
  const summary = el('div', { class: 'file-summary', attrs: { hidden: true } });
  const password = passwordInput('password', 'Password');
  const confirm = passwordInput('confirm', 'Confirm password');
  const confirmField = field('Confirm password', confirm);
  const formatField = el('div', { class: 'field' }, [
    el('span', { class: 'field-label', text: 'Format' }),
    segmented<OutputFormat>('Encrypted file format', [{ value: 'csb', label: 'Cyber Swiss Blade (.csb)' }, { value: 'aescrypt', label: 'AES Crypt (.aes)' }], format, (next) => (format = next)),
    el('span', { class: 'field-hint', text: 'AES Crypt files also open in AES Crypt, pyAesCrypt, and the earlier JS AES File Encryption tool.' }),
  ]);
  formatField.hidden = true;
  const status = el('p', { class: 'tool-status', attrs: { role: 'status' } });
  const action = button({ label: 'Choose a file first', icon: 'lock', variant: 'primary', disabled: true, onClick: () => void process() });

  const select = async (file: File): Promise<void> => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = fileKind(bytes);
    const encrypted = kind !== 'plain';
    selected = { name: file.name, size: file.size, bytes, kind };
    replaceChildren(summary, [icon(encrypted ? 'lock' : 'file', 20), el('div', {}, [el('strong', { text: file.name }), el('span', { class: 'muted', text: `${formatBytes(file.size)} · ${KIND_LABELS[kind]}` })])]);
    summary.hidden = false;
    confirmField.hidden = encrypted;
    formatField.hidden = encrypted;
    action.disabled = false;
    replaceChildren(action, [icon(encrypted ? 'unlock' : 'lock'), el('span', { text: encrypted ? 'Decrypt file' : 'Encrypt file' })]);
    status.textContent = '';
  };

  const process = async (): Promise<void> => {
    const file = selected;
    if (!file) return;
    await runBusy(action, status, async () => {
      if (file.kind === 'csb') {
        const result = await decryptBytes(file.bytes, password.value);
        downloadBlob(new Blob([result.bytes]), result.name || file.name.replace(/\.csb$/, ''));
        return `Decrypted ${result.name || 'file'} (${formatBytes(result.bytes.length)}).`;
      }
      if (file.kind === 'aescrypt') {
        const plain = await decryptAesCrypt(file.bytes, password.value);
        const name = plainFileName(file.name);
        downloadBlob(new Blob([plain]), name);
        return `Decrypted ${name} (${formatBytes(plain.length)}).`;
      }
      if (password.value !== confirm.value) throw mismatch;
      const encrypted = format === 'aescrypt' ? await encryptAesCrypt(file.bytes, password.value) : await encryptBytes(file.bytes, password.value, file.name);
      const name = format === 'aescrypt' ? aesCryptFileName(file.name) : encryptedFileName(file.name);
      downloadBlob(new Blob([encrypted], { type: 'application/octet-stream' }), name);
      return `Encrypted to ${name}. Keep the password safe: it cannot be recovered.`;
    });
  };

  return el('section', { class: 'card tool-panel stack' }, [
    dropZone('Drop a file or click to browse', 'Encrypt any file, or decrypt a .csb or .aes file', (file) => void select(file)),
    summary,
    formatField,
    el('div', { class: 'grid-2' }, [field('Password', password), confirmField]),
    el('div', { class: 'row' }, [action]),
    status,
  ]);
}

function textPanel(): HTMLElement {
  const input = el('textarea', { class: 'input mono', attrs: { rows: 7, placeholder: 'Plain text to encrypt, or Base64 ciphertext to decrypt', 'aria-label': 'Input' } });
  const output = el('textarea', { class: 'input mono', attrs: { rows: 7, readonly: true, 'aria-label': 'Output' } });
  const password = passwordInput('password', 'Password');
  const status = el('p', { class: 'tool-status', attrs: { role: 'status' } });
  const run = (actionButton: HTMLButtonElement, task: () => Promise<string>, done: string): void => {
    void runBusy(actionButton, status, async () => {
      output.value = await task();
      return done;
    });
  };
  const encrypt: HTMLButtonElement = button({ label: 'Encrypt', icon: 'lock', variant: 'primary', onClick: () => run(encrypt, () => encryptText(input.value, password.value), 'Encrypted. Share the ciphertext and the password separately.') });
  const decrypt: HTMLButtonElement = button({ label: 'Decrypt', icon: 'unlock', onClick: () => run(decrypt, () => decryptText(input.value, password.value), 'Decrypted.') });

  return el('section', { class: 'card tool-panel stack' }, [
    field('Input', input),
    field('Password', password),
    el('div', { class: 'row' }, [encrypt, decrypt]),
    el('div', { class: 'output-head' }, [el('span', { class: 'field-label', text: 'Output' }), button({ label: 'Copy output', icon: 'copy', iconOnly: true, variant: 'ghost', onClick: () => void copyToClipboard(output.value) })]),
    output,
    status,
  ]);
}
