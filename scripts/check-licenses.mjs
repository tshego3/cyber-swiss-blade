import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Build tools that are not MIT but are explicitly allowed (never shipped to the browser). */
const ALLOWED_EXCEPTIONS = new Map([['typescript', 'Apache-2.0: the TypeScript compiler, required by the project brief']]);

/** @param {string} directory @returns {string[]} */
function packageDirectories(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .flatMap((entry) => (entry.name.startsWith('@') ? readdirSync(join(directory, entry.name)).map((name) => join(directory, entry.name, name)) : [join(directory, entry.name)]));
}

/** @param {string} directory @returns {{ name: string, license: string } | null} */
function readPackage(directory) {
  const file = join(directory, 'package.json');
  if (!existsSync(file)) return null;
  const json = JSON.parse(readFileSync(file, 'utf8'));
  return { name: json.name, license: typeof json.license === 'string' ? json.license : 'UNKNOWN' };
}

const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const direct = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies });
const installed = packageDirectories('node_modules').map(readPackage).filter((entry) => entry !== null);
const byLicense = new Map();
for (const { name, license } of installed) byLicense.set(license, [...(byLicense.get(license) ?? []), name]);

console.log(`Runtime dependencies: ${Object.keys(manifest.dependencies ?? {}).length}`);
console.log('\nDirect dependencies:');
let failed = false;
for (const name of direct) {
  const license = installed.find((entry) => entry.name === name)?.license ?? 'NOT INSTALLED';
  const exception = ALLOWED_EXCEPTIONS.get(name);
  const ok = license === 'MIT' || exception !== undefined;
  failed ||= !ok;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}: ${license}${exception ? ` (${exception})` : ''}`);
}
console.log('\nAll installed packages by licence (dev tooling only):');
for (const [license, names] of [...byLicense].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${license}: ${names.length}${license === 'MIT' ? '' : ` -> ${names.join(', ')}`}`);
}
process.exitCode = failed ? 1 : 0;
