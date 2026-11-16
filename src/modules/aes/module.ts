import type { ToolModule } from '../../core/types';

export const aesModule: ToolModule = {
  id: 'aes',
  title: 'AES Encryption',
  summary: 'Encrypt and decrypt files or text with AES-256-GCM and a password. Nothing leaves the device.',
  icon: 'lock',
  category: 'Security',
  collections: [],
  load: () => import('./view'),
};
