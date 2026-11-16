import { concatBytes, utf8Decode, utf8Encode } from '../../../shared/bytes';

export type BsonValue = null | boolean | number | bigint | string | Uint8Array | Date | BsonDocument | readonly BsonValue[];

export interface BsonDocument {
  readonly [key: string]: BsonValue | undefined;
}

export interface BsonError {
  readonly type: 'bson';
  readonly message: string;
}

const TYPE = {
  double: 0x01,
  string: 0x02,
  document: 0x03,
  array: 0x04,
  binary: 0x05,
  undefined: 0x06,
  objectId: 0x07,
  boolean: 0x08,
  date: 0x09,
  null: 0x0a,
  regex: 0x0b,
  int32: 0x10,
  timestamp: 0x11,
  int64: 0x12,
  decimal128: 0x13,
  minKey: 0xff,
  maxKey: 0x7f,
} as const;

const INT32_MIN = -(2 ** 31);
const INT32_MAX = 2 ** 31 - 1;
const MAX_DEPTH = 64;

interface Reader {
  readonly bytes: Uint8Array;
  readonly view: DataView;
  position: number;
}

export function encodeDocument(document: BsonDocument): Uint8Array<ArrayBuffer> {
  const elements: Uint8Array[] = [];
  for (const [key, value] of Object.entries(document)) {
    if (value !== undefined) elements.push(encodeElement(key, value));
  }
  const body = concatBytes(elements);
  const result = new Uint8Array(body.length + 5);
  new DataView(result.buffer).setInt32(0, result.length, true);
  result.set(body, 4);
  return result;
}

export function isBsonDocument(value: BsonValue | undefined): value is BsonDocument {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Uint8Array) && !(value instanceof Date);
}

export function decodeDocument(bytes: Uint8Array): BsonDocument {
  const reader: Reader = { bytes, view: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), position: 0 };
  return Object.fromEntries(readElements(reader, 0));
}

function encodeElement(key: string, value: BsonValue): Uint8Array<ArrayBuffer> {
  if (key.includes('\0')) throw bsonError('Field names cannot contain null bytes.');
  const [type, payload] = encodeValue(value);
  return concatBytes([Uint8Array.of(type), cString(key), payload]);
}

function encodeValue(value: BsonValue): readonly [number, Uint8Array] {
  if (value === null) return [TYPE.null, new Uint8Array(0)];
  if (typeof value === 'boolean') return [TYPE.boolean, Uint8Array.of(value ? 1 : 0)];
  if (typeof value === 'number') return Number.isInteger(value) && value >= INT32_MIN && value <= INT32_MAX ? [TYPE.int32, int32(value)] : [TYPE.double, float64(value)];
  if (typeof value === 'bigint') return [TYPE.int64, int64(value)];
  if (typeof value === 'string') return [TYPE.string, bsonString(value)];
  if (value instanceof Uint8Array) return [TYPE.binary, concatBytes([int32(value.length), Uint8Array.of(0), value])];
  if (value instanceof Date) return [TYPE.date, int64(BigInt(value.getTime()))];
  if (isArray(value)) return [TYPE.array, encodeDocument(Object.fromEntries(value.map((item, index) => [String(index), item])))];
  return [TYPE.document, encodeDocument(value)];
}

function isArray(value: BsonValue): value is readonly BsonValue[] {
  return Array.isArray(value);
}

function readElements(reader: Reader, depth: number): [string, BsonValue][] {
  if (depth > MAX_DEPTH) throw bsonError('Document nesting is too deep.');
  const start = reader.position;
  const size = reader.view.getInt32(start, true);
  if (size < 5 || start + size > reader.bytes.length) throw bsonError('Document length is invalid.');
  const end = start + size - 1;
  reader.position += 4;
  const entries: [string, BsonValue][] = [];
  while (reader.position < end) {
    const type = reader.bytes[reader.position] ?? 0;
    reader.position += 1;
    const key = readCString(reader);
    entries.push([key, readValue(reader, type, depth)]);
  }
  reader.position = end + 1;
  return entries;
}

function readValue(reader: Reader, type: number, depth: number): BsonValue {
  const { view } = reader;
  const at = reader.position;
  switch (type) {
    case TYPE.double:
      reader.position += 8;
      return view.getFloat64(at, true);
    case TYPE.string:
      return readString(reader);
    case TYPE.document:
      return Object.fromEntries(readElements(reader, depth + 1));
    case TYPE.array:
      return readElements(reader, depth + 1).map(([, value]) => value);
    case TYPE.binary:
      return readBinary(reader);
    case TYPE.objectId:
      reader.position += 12;
      return [...reader.bytes.subarray(at, at + 12)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    case TYPE.boolean:
      reader.position += 1;
      return reader.bytes[at] === 1;
    case TYPE.date:
      reader.position += 8;
      return new Date(Number(view.getBigInt64(at, true)));
    case TYPE.null:
    case TYPE.undefined:
    case TYPE.minKey:
    case TYPE.maxKey:
      return null;
    case TYPE.regex:
      return `/${readCString(reader)}/${readCString(reader)}`;
    case TYPE.int32:
      reader.position += 4;
      return view.getInt32(at, true);
    case TYPE.timestamp:
      reader.position += 8;
      return view.getBigUint64(at, true);
    case TYPE.int64:
      reader.position += 8;
      return safeNumber(view.getBigInt64(at, true));
    case TYPE.decimal128:
      reader.position += 16;
      return reader.bytes.slice(at, at + 16);
    default:
      throw bsonError(`Unsupported BSON type 0x${type.toString(16)}.`);
  }
}

function readString(reader: Reader): string {
  const length = reader.view.getInt32(reader.position, true);
  const start = reader.position + 4;
  reader.position = start + length;
  return utf8Decode(reader.bytes.subarray(start, start + length - 1));
}

function readBinary(reader: Reader): Uint8Array {
  const length = reader.view.getInt32(reader.position, true);
  const start = reader.position + 5;
  reader.position = start + length;
  return reader.bytes.slice(start, start + length);
}

function readCString(reader: Reader): string {
  const end = reader.bytes.indexOf(0, reader.position);
  if (end < 0) throw bsonError('Unterminated field name.');
  const value = utf8Decode(reader.bytes.subarray(reader.position, end));
  reader.position = end + 1;
  return value;
}

function safeNumber(value: bigint): number | bigint {
  return value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value;
}

function cString(value: string): Uint8Array<ArrayBuffer> {
  return concatBytes([utf8Encode(value), Uint8Array.of(0)]);
}

function bsonString(value: string): Uint8Array<ArrayBuffer> {
  const bytes = utf8Encode(value);
  return concatBytes([int32(bytes.length + 1), bytes, Uint8Array.of(0)]);
}

function int32(value: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setInt32(0, value, true);
  return bytes;
}

function int64(value: bigint): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigInt64(0, value, true);
  return bytes;
}

function float64(value: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat64(0, value, true);
  return bytes;
}

function bsonError(message: string): BsonError {
  return { type: 'bson', message };
}
