import { concatBytes } from '../../../shared/bytes';
import { decodeDocument, encodeDocument, type BsonDocument } from './bson';

const OP_MSG = 2013;
const HEADER_BYTES = 16;
const MAX_MESSAGE_BYTES = 48 * 1024 * 1024;
const CHECKSUM_PRESENT = 1;

export interface DuplexStream {
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<Uint8Array>;
  readonly close: () => Promise<void> | void;
}

export interface MongoServerError {
  readonly type: 'mongo';
  readonly message: string;
  readonly code: number;
}

export interface WireConnection {
  readonly command: (database: string, command: BsonDocument) => Promise<BsonDocument>;
  readonly close: () => Promise<void>;
}

export function isMongoServerError(error: unknown): error is MongoServerError {
  return typeof error === 'object' && error !== null && 'type' in error && error.type === 'mongo';
}

export function openWireConnection(stream: DuplexStream): WireConnection {
  const reader = stream.readable.getReader();
  const writer = stream.writable.getWriter();
  let buffer = new Uint8Array(0);
  let nextRequestId = 1;

  const readExactly = async (length: number): Promise<Uint8Array<ArrayBuffer>> => {
    while (buffer.length < length) {
      const { value, done } = await reader.read();
      if (done) throw connectionError('The database closed the connection.');
      buffer = concatBytes([buffer, value]);
    }
    const chunk = buffer.slice(0, length);
    buffer = buffer.slice(length);
    return chunk;
  };

  const command = async (database: string, body: BsonDocument): Promise<BsonDocument> => {
    const requestId = nextRequestId;
    nextRequestId += 1;
    await writer.write(frame(requestId, encodeDocument({ ...body, $db: database })));
    const header = await readExactly(HEADER_BYTES);
    const view = new DataView(header.buffer);
    const length = view.getInt32(0, true);
    if (length <= HEADER_BYTES || length > MAX_MESSAGE_BYTES) throw connectionError('The database sent an invalid message length.');
    if (view.getInt32(8, true) !== requestId || view.getInt32(12, true) !== OP_MSG) throw connectionError('The database sent an unexpected reply.');
    const reply = parseReply(await readExactly(length - HEADER_BYTES));
    if (reply.ok !== 1) throw serverError(reply);
    return reply;
  };

  const close = async (): Promise<void> => {
    try {
      await writer.close();
    } catch {
      console.warn('Database stream was already closed.');
    }
    await stream.close();
  };

  return { command, close };
}

function frame(requestId: number, document: Uint8Array): Uint8Array<ArrayBuffer> {
  const message = new Uint8Array(HEADER_BYTES + 5 + document.length);
  const view = new DataView(message.buffer);
  view.setInt32(0, message.length, true);
  view.setInt32(4, requestId, true);
  view.setInt32(8, 0, true);
  view.setInt32(12, OP_MSG, true);
  view.setUint32(16, 0, true);
  message[20] = 0;
  message.set(document, 21);
  return message;
}

function parseReply(body: Uint8Array<ArrayBuffer>): BsonDocument {
  const flags = new DataView(body.buffer).getUint32(0, true);
  const end = flags & CHECKSUM_PRESENT ? body.length - 4 : body.length;
  if (body[4] !== 0) throw connectionError('The database reply has no body section.');
  return decodeDocument(body.subarray(5, end));
}

function serverError(reply: BsonDocument): MongoServerError {
  const code = typeof reply.code === 'number' ? reply.code : 0;
  const message = typeof reply.errmsg === 'string' ? reply.errmsg : 'Command failed.';
  return { type: 'mongo', message, code };
}

function connectionError(message: string): MongoServerError {
  return { type: 'mongo', message, code: -1 };
}
