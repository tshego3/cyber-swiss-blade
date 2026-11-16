import { createHash, pbkdf2Sync, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import { parseReportRow } from '../src/modules/timesheet/report-format.ts';

const PASSWORD_ITERATIONS = 600_000;
const BATCH = 200;
const IMPORT_TIME = '2000-01-01T00:00:00.000Z';
const NO_PULL = '9999-12-31T23:59:59.999Z';
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

/** @param {Buffer} buffer @returns {Map<string, string>} */
export function unzip(buffer) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new Error('This is not an .xlsx file.');
  const count = buffer.readUInt16LE(end + 10);
  let at = buffer.readUInt32LE(end + 16);
  const files = new Map();
  for (let index = 0; index < count; index += 1) {
    const method = buffer.readUInt16LE(at + 10);
    const size = buffer.readUInt32LE(at + 20);
    const nameLength = buffer.readUInt16LE(at + 28);
    const extraLength = buffer.readUInt16LE(at + 30);
    const commentLength = buffer.readUInt16LE(at + 32);
    const offset = buffer.readUInt32LE(at + 42);
    const name = buffer.subarray(at + 46, at + 46 + nameLength).toString('utf8');
    const start = offset + 30 + buffer.readUInt16LE(offset + 26) + buffer.readUInt16LE(offset + 28);
    const data = buffer.subarray(start, start + size);
    files.set(name, (method === 8 ? inflateRawSync(data) : data).toString('utf8'));
    at += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

/** @param {string} value */
function decode(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, entity) => {
    if (entity[0] === '#') return String.fromCodePoint(entity[1] === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
    return ENTITIES[entity] ?? match;
  });
}

/** @param {string} xml */
function texts(xml) {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((match) => decode(match[1])).join('');
}

/** @param {Map<string, string>} files */
export function readDays(files) {
  const shared = [...(files.get('xl/sharedStrings.xml') ?? '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) => texts(match[1]));
  const rels = new Map([...(files.get('xl/_rels/workbook.xml.rels') ?? '').matchAll(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)].map((match) => [match[1], match[2]]));
  const days = [];
  for (const sheet of (files.get('xl/workbook.xml') ?? '').matchAll(/<sheet [^>]*r:id="([^"]+)"/g)) {
    const target = (rels.get(sheet[1]) ?? '').replace(/^\/?(xl\/)?/, 'xl/');
    for (const row of (files.get(target) ?? '').matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = new Map();
      for (const cell of row[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const type = /t="(\w+)"/.exec(cell[2])?.[1];
        const body = cell[3] ?? '';
        const value = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
        cells.set(cell[1], type === 's' ? (shared[Number(value)] ?? '') : type === 'inlineStr' ? texts(body) : decode(value ?? ''));
      }
      const serial = Number(cells.get('A'));
      if (!Number.isInteger(serial) || serial < 30000) continue;
      const codes = (cells.get('B') ?? '').split(' & ').map((code) => code.trim()).filter(Boolean);
      const hours = Number(cells.get('C') ?? 0) || 0;
      const comment = (cells.get('D') ?? '').trim();
      if (codes.length === 0 && !comment) continue;
      days.push({ date: new Date(EXCEL_EPOCH + serial * 86_400_000).toISOString().slice(0, 10), codes, hours: Math.round(hours * 100) / 100, comment });
    }
  }
  return days;
}

/** @param {string} name */
export function codeId(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return `code-${slug}-${createHash('sha256').update(name).digest('hex').slice(0, 6)}`;
}

/** @param {string} question @param {boolean} hidden */
function ask(question, hidden = false) {
  const reader = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) reader._writeToOutput = (text) => process.stdout.write(text.includes(question) ? text : '');
  return new Promise((resolve) => reader.question(question, (answer) => (reader.close(), hidden && process.stdout.write('\n'), resolve(answer))));
}

/** @param {string} url @param {object} body @param {string} [token] */
async function post(url, body, token) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error ?? `The server returned ${response.status}.`);
  return json;
}

async function main() {
  const [file, ...flags] = process.argv.slice(2);
  const api = flags[flags.indexOf('--api') + 1];
  const dryRun = flags.includes('--dry-run');
  if (!file || (!dryRun && (!flags.includes('--api') || !api))) {
    console.log('Usage: node scripts/import-agile-report.mjs <report.xlsx> --api <Worker URL> [--dry-run]');
    process.exit(1);
  }
  const days = readDays(unzip(readFileSync(file)));
  const names = [...new Set(days.flatMap((day) => day.codes))];
  console.log(`Found ${days.length} filled days and ${names.length} project or billing codes in column B.`);
  const items = days.reduce((total, day) => total + parseReportRow(day, new Map(), names).filter((log) => log.kind === 'work').length, 0);
  console.log(`Found ${items} work items with their own billing code.`);
  for (const [month, count] of Object.entries(Object.groupBy(days, (day) => day.date.slice(0, 7)))) console.log(`  ${month}: ${count.length} days`);
  if (dryRun) return;

  const username = (await ask('Username: ')).trim().toLowerCase();
  const password = await ask('Password: ', true);
  const passwordKey = pbkdf2Sync(Buffer.from(password.normalize('NFKC')), `csb:v1:${username}`, PASSWORD_ITERATIONS, 32, 'sha256').toString('base64');
  const baseUrl = api.replace(/\/+$/, '');
  const session = await post(`${baseUrl}/auth/login`, { username, passwordKey });
  console.log(`Signed in as ${session.user.displayName}.`);

  const owner = session.user.id.replace(/[^A-Za-z0-9]/g, '').slice(0, 8);
  const codeIds = new Map(names.map((name) => [name, codeId(name)]));
  const codes = names.map((name) => ({ id: codeId(name), updatedAt: IMPORT_TIME, deleted: false, data: { name, archived: false } }));
  const logs = days.flatMap((day) =>
    parseReportRow(day, codeIds, names).map((data, index) => ({ id: `imp-${owner}-${day.date}-${index}`, updatedAt: `${day.date}T00:00:00.000Z`, deleted: false, data })),
  );
  let kept = 0;
  for (let start = 0; start < Math.max(codes.length, logs.length); start += BATCH) {
    const batch = { timesheet_codes: codes.slice(start, start + BATCH), timesheet_logs: logs.slice(start, start + BATCH) };
    const collections = Object.fromEntries(Object.entries(batch).filter(([, changes]) => changes.length > 0).map(([name, changes]) => [name, { since: NO_PULL, changes }]));
    const response = await post(`${baseUrl}/sync`, { collections }, session.token);
    for (const [name, changes] of Object.entries(batch)) {
      const sent = new Map(changes.map((change) => [change.id, change.updatedAt]));
      kept += (response.collections?.[name]?.records ?? []).filter((record) => sent.has(record.id) && record.updatedAt !== sent.get(record.id)).length;
    }
    console.log(`Sent ${Math.min(start + BATCH, logs.length)} of ${logs.length} entries.`);
  }
  if (kept > 0) console.log(`${kept} entries were changed in the app after an earlier import. The import kept those changes.`);
  console.log('Import complete. Open the Timesheet and wait for the next sync.');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(`Import failed: ${error.message}`);
    process.exit(1);
  });
}
