import { utf8Decode } from '../../shared/bytes';

export async function readZip(blob: Blob): Promise<Map<string, string>> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const files = new Map<string, string>();
  let at = 0;
  while (view.getUint32(at, true) === 0x04034b50) {
    const size = view.getUint32(at + 18, true);
    const nameLength = view.getUint16(at + 26, true);
    const name = utf8Decode(bytes.subarray(at + 30, at + 30 + nameLength));
    const start = at + 30 + nameLength;
    const stream = new Blob([bytes.slice(start, start + size)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    files.set(name, utf8Decode(new Uint8Array(await new Response(stream).arrayBuffer())));
    at = start + size;
  }
  return files;
}
