import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { createRequire } from 'node:module';

const target = process.env.DEVNOTES_BETA3_TARGET || 'http://127.0.0.1:4331/';
const origin = process.env.DEVNOTES_ORIGIN || 'http://127.0.0.1:4347';
const helperPath = process.env.DEVNOTES_CHROMIUM_HELPER
  || '/Users/tryskian/.codex/skills/dev-chromium/scripts/chromium.cjs';

await access(helperPath);
const require = createRequire(helperPath);
const helper = require(helperPath);
const chosen = helper.findChromium();
const playwright = createRequire(`${helper.runtimeRoot}/package.json`)('playwright');
const browser = await playwright.chromium.launch({ headless: true, executablePath: chosen.executablePath });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

try {
  await page.goto(target, { waitUntil: 'networkidle' });
  const before = await page.locator('main').evaluate((element) => element.outerHTML);
  const originalText = await page.locator('h1').innerText();
  await page.addScriptTag({ url: `${origin}/beta3.js` });
  await page.waitForFunction(() => window.__devNotesBeta3?.state().layers > 0);
  const frozenState = await page.evaluate(() => window.__devNotesBeta3.state());

  const textRect = await page.locator('#devnotes-beta3').evaluate((host) => {
    const doc = host.shadowRoot.querySelector('.frame').contentDocument;
    const heading = doc.querySelector('h1');
    const element = [...heading.querySelectorAll('*')]
      .find((candidate) => candidate.childElementCount === 0 && candidate.textContent.trim())
      || heading;
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  await page.mouse.click(textRect.x + textRect.width / 2, textRect.y + textRect.height / 2);
  const parentButton = page.locator('#devnotes-beta3 .select-parent');
  if (!await parentButton.isDisabled()) await parentButton.click();

  const headingBefore = await page.locator('#devnotes-beta3').evaluate((host) => {
    const element = host.shadowRoot.querySelector('.frame').contentDocument.querySelector('h1');
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  const labelBox = await page.locator('#devnotes-beta3 .selection-label').boundingBox();
  assert.ok(labelBox);
  await page.mouse.move(labelBox.x + labelBox.width / 2, labelBox.y + labelBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(labelBox.x + labelBox.width / 2 + 42, labelBox.y + labelBox.height / 2 + 26, { steps: 8 });
  await page.mouse.up();

  const eastBox = await page.locator('#devnotes-beta3 .handle-e').boundingBox();
  assert.ok(eastBox);
  await page.mouse.move(eastBox.x + eastBox.width / 2, eastBox.y + eastBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(eastBox.x + eastBox.width / 2 + 90, eastBox.y + eastBox.height / 2, { steps: 8 });
  await page.mouse.up();

  const editableRect = await page.locator('#devnotes-beta3').evaluate((host) => {
    const doc = host.shadowRoot.querySelector('.frame').contentDocument;
    const heading = doc.querySelector('h1');
    const element = [...heading.querySelectorAll('[data-devnotes-beta3-text-layer="true"]')][0]
      || heading;
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  await page.mouse.click(editableRect.x + editableRect.width / 2, editableRect.y + editableRect.height / 2);
  await page.locator('#devnotes-beta3 .edit-copy').click();
  await page.keyboard.type('Beta 3 proof');
  await page.locator('#devnotes-beta3 .brand').click();

  const experiment = await page.locator('#devnotes-beta3').evaluate((host) => {
    const heading = host.shadowRoot.querySelector('.frame').contentDocument.querySelector('h1');
    const rect = heading.getBoundingClientRect();
    return { x: rect.x, width: rect.width, text: heading.textContent, state: window.__devNotesBeta3.state() };
  });
  assert.match(experiment.text, /Beta 3 proof/);
  assert.ok(experiment.x > headingBefore.x + 30);
  assert.ok(experiment.width > headingBefore.width + 70);
  assert.equal(experiment.state.history.length, 3);

  await page.locator('#devnotes-beta3 .view-original').click();
  const original = await page.locator('#devnotes-beta3').evaluate((host) => {
    const heading = host.shadowRoot.querySelector('.frame').contentDocument.querySelector('h1');
    const rect = heading.getBoundingClientRect();
    return { x: rect.x, width: rect.width, text: heading.textContent };
  });
  assert.equal(original.text.trim(), originalText.trim());
  assert.ok(Math.abs(original.x - headingBefore.x) < 1);
  assert.ok(Math.abs(original.width - headingBefore.width) < 1);

  await page.locator('#devnotes-beta3 .view-experiment').click();
  await page.locator('#devnotes-beta3 .reset').click();
  assert.equal((await page.evaluate(() => window.__devNotesBeta3.state())).history.length, 0);
  await page.locator('#devnotes-beta3 .exit').click();
  await page.waitForFunction(() => !window.__devNotesBeta3);
  const after = await page.locator('main').evaluate((element) => element.outerHTML);
  assert.equal(after, before);
  assert.deepEqual(errors, []);

  console.log(JSON.stringify({
    target,
    layers: frozenState.layers,
    operations: ['move-layer', 'resize-layer', 'edit-copy'],
    originalText,
    sourceUnchanged: after === before,
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
