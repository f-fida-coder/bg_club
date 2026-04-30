import { build, context } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load order matches the original <script> tag order in index.html.
const SOURCES = [
  'tweaks-panel.jsx',
  'src/ui.jsx',
  'src/activity.jsx',
  'src/landing.jsx',
  'src/auth.jsx',
  'src/wallet.jsx',
  'src/blackjack-table.jsx',
  'src/game-shell.jsx',
  'src/admin.jsx',
  'src/manager.jsx',
  'src/app.jsx',
];

async function concatenate() {
  const parts = [];
  for (const rel of SOURCES) {
    const abs = join(__dirname, rel);
    const text = await readFile(abs, 'utf8');
    parts.push(`/* ===== ${rel} ===== */\n${text}\n`);
  }
  return parts.join('\n');
}

async function run() {
  const watch = process.argv.includes('--watch');
  const distDir = join(__dirname, 'dist');
  await mkdir(distDir, { recursive: true });
  const tmpEntry = join(distDir, '_bundle.jsx');

  async function rebuild(label = 'build') {
    const t0 = Date.now();
    const concatenated = await concatenate();
    await writeFile(tmpEntry, concatenated, 'utf8');
    await build({
      entryPoints: [tmpEntry],
      outfile: join(distDir, 'app.js'),
      bundle: false,
      loader: { '.jsx': 'jsx' },
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      target: 'es2018',
      minify: true,
      sourcemap: false,
      legalComments: 'none',
    });
    console.log(`[${label}] dist/app.js (${Date.now() - t0}ms)`);
  }

  await rebuild('build');

  if (watch) {
    const { watch: fsWatch } = await import('node:fs');
    let timer;
    const trigger = () => {
      clearTimeout(timer);
      timer = setTimeout(() => rebuild('rebuild').catch(e => console.error(e)), 80);
    };
    for (const rel of SOURCES) {
      fsWatch(join(__dirname, rel), trigger);
    }
    console.log('Watching', SOURCES.length, 'files…');
  }
}

run().catch(e => { console.error(e); process.exit(1); });
