import { describe, expect, it } from 'vitest';
import { utf8Encode } from '../../shared/bytes';
import { readZip } from '../test-support/read-zip';
import { crc32, createZip } from './zip';

describe('zip', () => {
  it('computes the standard CRC-32', () => {
    expect(crc32(utf8Encode('123456789'))).toBe(0xcbf43926);
  });

  it('writes deflated entries that read back unchanged', async () => {
    const zip = await createZip([
      { name: 'a.txt', data: utf8Encode('hello '.repeat(100)) },
      { name: 'folder/ü.xml', data: utf8Encode('<x/>') },
    ]);
    const files = await readZip(zip);
    expect([...files.keys()]).toEqual(['a.txt', 'folder/ü.xml']);
    expect(files.get('a.txt')).toBe('hello '.repeat(100));
  });
});
