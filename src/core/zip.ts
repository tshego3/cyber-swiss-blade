import { concatBytes, utf8Encode } from '../../shared/bytes';

export interface ZipEntry {
  readonly name: string;
  readonly data: Uint8Array;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export async function deflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(data)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function createZip(entries: readonly ZipEntry[], modified = new Date()): Promise<Blob> {
  const time = (modified.getHours() << 11) | (modified.getMinutes() << 5) | Math.floor(modified.getSeconds() / 2);
  const date = ((modified.getFullYear() - 1980) << 9) | ((modified.getMonth() + 1) << 5) | modified.getDate();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = utf8Encode(entry.name);
    const compressed = await deflateRaw(entry.data);
    const fields = { crc: crc32(entry.data), compressed: compressed.length, size: entry.data.length, time, date };
    const local = concatBytes([header(0x04034b50, name, fields, null), compressed]);
    centrals.push(header(0x02014b50, name, fields, offset));
    locals.push(local);
    offset += local.length;
  }
  const directory = concatBytes(centrals);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, directory.length, true);
  end.setUint32(16, offset, true);
  return new Blob([...locals, directory, new Uint8Array(end.buffer)].map((part) => new Uint8Array(part)), { type: 'application/zip' });
}

interface HeaderFields {
  readonly crc: number;
  readonly compressed: number;
  readonly size: number;
  readonly time: number;
  readonly date: number;
}

function header(signature: number, name: Uint8Array, fields: HeaderFields, centralOffset: number | null): Uint8Array {
  const central = centralOffset !== null;
  const view = new DataView(new ArrayBuffer(central ? 46 : 30));
  let at = 0;
  const u16 = (value: number): void => {
    view.setUint16(at, value, true);
    at += 2;
  };
  const u32 = (value: number): void => {
    view.setUint32(at, value, true);
    at += 4;
  };
  u32(signature);
  if (central) u16(20);
  u16(20);
  u16(0x0800);
  u16(8);
  u16(fields.time);
  u16(fields.date);
  u32(fields.crc);
  u32(fields.compressed);
  u32(fields.size);
  u16(name.length);
  u16(0);
  if (central) {
    u16(0);
    u16(0);
    u16(0);
    u32(0);
    u32(centralOffset);
  }
  return concatBytes([new Uint8Array(view.buffer), name]);
}
