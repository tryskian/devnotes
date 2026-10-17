import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const devnotesPort = 4350;
const targetPort = 4351;
const devnotesOrigin = `http://127.0.0.1:${devnotesPort}`;
const targetOrigin = `http://127.0.0.1:${targetPort}`;
const helperPath = process.env.DEVNOTES_CHROMIUM_HELPER
  || '/Users/tryskian/.codex/skills/dev-chromium/scripts/chromium.cjs';
const require = createRequire(helperPath);
const helper = require(helperPath);
const chosen = helper.findChromium();
const playwright = createRequire(`${helper.runtimeRoot}/package.json`)('playwright');
const dataDirectory = await mkdtemp(join(tmpdir(), 'devnotes-external-page-'));

const child = spawn(process.execPath, ['server.mjs'], {
  cwd: new URL('..', import.meta.url),
  env: {
    ...process.env,
    ANNOTATION_PORT: String(devnotesPort),
    ANNOTATION_DATA_DIR: dataDirectory,
  },
  stdio: 'ignore',
});
const target = createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html><html><head><title>External keyboard canvas</title></head><body><main><h1>Outside the portfolio</h1><p>Interactive host fixture.</p></main><script>addEventListener('keydown',event=>{if(event.key===' ')event.preventDefault();});</script></body></html>`);
});
await new Promise((resolve) => target.listen(targetPort, '127.0.0.1', resolve));

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(`${devnotesOrigin}/health`)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('DevNotes test server did not start');
}

const browser = await playwright.chromium.launch({ headless: true, executablePath: chosen.executablePath });
try {
  await waitForServer();
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  await page.goto(targetOrigin, { waitUntil: 'networkidle' });
  await page.addScriptTag({ url: `${devnotesOrigin}/client.js` });
  await page.waitForFunction(() => Boolean(window.__devNotes));
  await page.locator('#devnotes').evaluate((host) => {
    const root = host.shadowRoot;
    root.querySelector('.editor').hidden = false;
    root.querySelector('#lia-note').focus();
  });
  await page.keyboard.type('spaces stay inside devnotes');
  const value = await page.locator('#devnotes').evaluate((host) => host.shadowRoot.querySelector('#lia-note').value);
  assert.equal(value, 'spaces stay inside devnotes');

  await page.addScriptTag({ url: `${devnotesOrigin}/beta3.js` });
  await page.waitForFunction(() => window.__devNotesBeta3?.state().layers > 0);
  const beta3 = await page.evaluate(() => window.__devNotesBeta3.state());
  assert.ok(beta3.layers > 0);
  assert.equal(beta3.sourceUrl, `${targetOrigin}/`);

  console.log(JSON.stringify({ spaces: true, beta3Layers: beta3.layers, sourceUrl: beta3.sourceUrl }, null, 2));
} finally {
  await browser.close();
  target.close();
  child.kill();
  await rm(dataDirectory, { recursive: true, force: true });
}
