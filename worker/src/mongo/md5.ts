import { utf8Encode } from '../../../shared/bytes';

const SHIFTS = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
const CONSTANTS = Array.from({ length: 64 }, (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32) >>> 0);

export function md5Hex(text: string): string {
  const input = utf8Encode(text);
  const length = (((input.length + 8) >>> 6) + 1) * 64;
  const bytes = new Uint8Array(length);
  bytes.set(input);
  bytes[input.length] = 0x80;
  const view = new DataView(bytes.buffer);
  view.setUint32(length - 8, (input.length * 8) >>> 0, true);
  view.setUint32(length - 4, Math.floor(input.length / 2 ** 29), true);

  const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let offset = 0; offset < length; offset += 64) {
    let [a = 0, b = 0, c = 0, d = 0] = state;
    for (let step = 0; step < 64; step += 1) {
      const round = step >>> 4;
      const mix = [(b & c) | (~b & d), (d & b) | (~d & c), b ^ c ^ d, c ^ (b | ~d)][round] ?? 0;
      const word = [step, 5 * step + 1, 3 * step + 5, 7 * step][round] ?? 0;
      const sum = (a + mix + (CONSTANTS[step] ?? 0) + view.getUint32(offset + (word % 16) * 4, true)) >>> 0;
      const shift = SHIFTS[round * 4 + (step % 4)] ?? 0;
      [a, d, c] = [d, c, b];
      b = (b + ((sum << shift) | (sum >>> (32 - shift)))) >>> 0;
    }
    state[0] = ((state[0] ?? 0) + a) >>> 0;
    state[1] = ((state[1] ?? 0) + b) >>> 0;
    state[2] = ((state[2] ?? 0) + c) >>> 0;
    state[3] = ((state[3] ?? 0) + d) >>> 0;
  }
  const digest = new DataView(new ArrayBuffer(16));
  state.forEach((value, index) => digest.setUint32(index * 4, value, true));
  return Array.from(new Uint8Array(digest.buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
