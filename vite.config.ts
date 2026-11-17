import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { buildEntry } from './src/modules/docs/entry';

const BASE = '/cyber-swiss-blade/';
const SERVICE_WORKER = 'sw.js';

const DOCS_ARTICLES = 'src/modules/docs/articles';

function docsImageOrigins(): string[] {
  const origins = new Set<string>();
  for (const file of readdirSync(DOCS_ARTICLES).filter((name) => name.endsWith('.md'))) {
    for (const match of readFileSync(join(DOCS_ARTICLES, file), 'utf8').matchAll(/!\[[^\]]*\]\((https:\/\/[^)\s]+)/g)) {
      origins.add(new URL(match[1] ?? '').origin);
    }
  }
  return [...origins].sort();
}

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  ["img-src 'self' data: blob:", ...docsImageOrigins()].join(' '),
  "connect-src 'self' https: http://localhost:* http://127.0.0.1:*",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function listFiles(directory: string): string[] {
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(directory, join(entry.parentPath, entry.name)));
}

function precachePlugin(): Plugin {
  let publicDir = '';
  return {
    name: 'csb-precache',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    transformIndexHtml(html) {
      return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`);
    },
    generateBundle(_options, bundle) {
      const worker = bundle[SERVICE_WORKER];
      if (!worker || worker.type !== 'chunk') {
        this.error(`${SERVICE_WORKER} was not emitted`);
      }
      const hash = createHash('sha256').update(worker.code);
      const bundled = Object.values(bundle).filter((file) => file.fileName !== SERVICE_WORKER);
      for (const file of bundled) {
        hash.update(file.fileName).update(file.type === 'chunk' ? file.code : file.source);
      }
      const publicFiles = listFiles(publicDir);
      for (const file of publicFiles) {
        hash.update(file).update(readFileSync(join(publicDir, file)));
      }
      const files = ['./', ...[...bundled.map((file) => file.fileName), ...publicFiles].sort().map((file) => `./${file}`)];
      const manifest = { version: hash.digest('hex').slice(0, 12), files };
      worker.code = `const CSB_MANIFEST = ${JSON.stringify(manifest)};\n${worker.code}`;
    },
  };
}

const DOCS_META_QUERY = '?meta';

function docsIndexPlugin(): Plugin {
  return {
    name: 'csb-docs-index',
    enforce: 'pre',
    load(id) {
      if (!id.endsWith(`.md${DOCS_META_QUERY}`)) return null;
      const file = id.slice(0, -DOCS_META_QUERY.length);
      this.addWatchFile(file);
      const entry = buildEntry(basename(file, '.md'), readFileSync(file, 'utf8'));
      return `export default ${JSON.stringify(entry)};`;
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [docsIndexPlugin(), precachePlugin()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022',
    rollupOptions: {
      input: { app: 'index.html', sw: 'src/sw.ts' },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'sw' ? SERVICE_WORKER : 'assets/[name]-[hash].js'),
      },
    },
  },
});
