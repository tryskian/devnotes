import { access, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium as projectChromium } from 'playwright-core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = process.env.DEVNOTES_ORIGIN || 'http://127.0.0.1:4347';
const helperPath = process.env.DEVNOTES_CHROMIUM_HELPER
  || '/Users/tryskian/.codex/skills/dev-chromium/scripts/chromium.cjs';

async function browserRuntime() {
  if (process.env.DEVNOTES_CHROMIUM_EXECUTABLE) {
    return { chromium: projectChromium, executablePath: process.env.DEVNOTES_CHROMIUM_EXECUTABLE };
  }
  try {
    await access(helperPath);
    const require = createRequire(helperPath);
    const helper = require(helperPath);
    const chosen = helper.findChromium();
    const playwright = createRequire(resolve(helper.runtimeRoot, 'package.json'))('playwright');
    return { chromium: playwright.chromium, executablePath: chosen.executablePath };
  } catch (error) {
    throw new Error(`Actual Chromium was not found. Set DEVNOTES_CHROMIUM_EXECUTABLE. ${error.message}`);
  }
}

async function request(path, options) {
  const response = await fetch(`${origin}${path}`, options);
  const result = await response.json();
  if (!response.ok || result.ok === false) throw new Error(result.error || `request_failed_${response.status}`);
  return result;
}

function selectionsFor(note) {
  if (Array.isArray(note.selections) && note.selections.length) return note.selections;
  return note.selection ? [note.selection] : [];
}

const [{ notes }, { notebook }] = await Promise.all([
  request('/api/notes'),
  request('/api/notebook'),
]);

if (!notes.length) {
  console.log('No notes to capture.');
  process.exit(0);
}

const clientSource = await (await fetch(`${origin}/client.js`)).text();
const runtime = await browserRuntime();
const browser = await runtime.chromium.launch({ headless: true, executablePath: runtime.executablePath });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const failures = [];
let captured = 0;

try {
  for (const note of notes) {
    try {
      const response = await page.goto(note.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      if (response && response.status() >= 400) throw new Error(`page_returned_${response.status()}`);
      const firstPoint = selectionsFor(note)[0]?.points?.[0];
      if (firstPoint) {
        await page.evaluate((y) => scrollTo(0, Math.max(0, y - innerHeight * 0.35)), firstPoint.y);
      }
      await page.addScriptTag({ content: clientSource });
      await page.waitForFunction(() => Boolean(window.__devNotes), null, { timeout: 10_000 });
      await page.evaluate((noteId) => window.__devNotes.captureOnly(noteId), note.id);
      await page.waitForTimeout(80);
      const bounds = await page.evaluate((noteId) => window.__devNotes.captureBounds(noteId), note.id);
      if (bounds && (bounds.top < 72 || bounds.bottom > 828)) {
        await page.evaluate((top) => scrollBy(0, top - 180), bounds.top);
        await page.waitForTimeout(80);
      }
      const image = await page.screenshot({ type: 'jpeg', quality: 76 });
      await request('/api/thumbnails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: note.id,
          noteNumber: note.number,
          url: note.url,
          width: 1440,
          height: 900,
          viewport: { width: 1440, height: 900, devicePixelRatio: 1 },
          sourceRevision: notebook.revision,
          dataUrl: `data:image/jpeg;base64,${image.toString('base64')}`,
        }),
      });
      captured += 1;
    } catch (error) {
      failures.push(`note ${note.number}: ${error.message}`);
    }
  }
} finally {
  await browser.close();
}

const summary = `Captured ${captured} of ${notes.length} note thumbnail${notes.length === 1 ? '' : 's'}.`;
console.log(failures.length ? `${summary} ${failures.join(' ')}` : summary);
if (captured === 0) process.exitCode = 1;
