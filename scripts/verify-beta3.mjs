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
    const rect = doc.querySelector('h1').getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  await page.mouse.click(textRect.x + textRect.width / 2, textRect.y + textRect.height / 2);

  const headingBefore = await page.locator('#devnotes-beta3').evaluate((host) => {
    const element = host.shadowRoot.querySelector('.frame').contentDocument.querySelector('h1');
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  const labelBox = await page.locator('#devnotes-beta3 .selection-label').boundingBox();
  assert.ok(labelBox);
  await page.mouse.move(labelBox.x + labelBox.width / 2, labelBox.y + labelBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(labelBox.x + labelBox.width / 2 - headingBefore.x + 3, labelBox.y + labelBox.height / 2, { steps: 8 });
  const guide = await page.locator('#devnotes-beta3').evaluate((host) => {
    const element = host.shadowRoot.querySelector('.guide-v');
    return { hidden: element.hidden, left: Number.parseFloat(element.style.left) };
  });
  assert.equal(guide.hidden, false);
  assert.ok(Number.isFinite(guide.left));
  await page.mouse.up();
  assert.equal(await page.locator('#devnotes-beta3').evaluate((host) => host.shadowRoot.querySelector('.guide-v').hidden), true);
  const movedHeading = await page.locator('#devnotes-beta3').evaluate((host) => {
    const heading = host.shadowRoot.querySelector('.frame').contentDocument.querySelector('h1');
    const rect = heading.getBoundingClientRect();
    return { x: rect.x, width: rect.width };
  });
  assert.ok(Math.min(
    Math.abs(movedHeading.x - guide.left),
    Math.abs(movedHeading.x + movedHeading.width / 2 - guide.left),
    Math.abs(movedHeading.x + movedHeading.width - guide.left),
  ) < 1);

  const eastBox = await page.locator('#devnotes-beta3 .handle-e').boundingBox();
  assert.ok(eastBox);
  await page.mouse.move(eastBox.x + eastBox.width / 2, eastBox.y + eastBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(eastBox.x + eastBox.width / 2 + 90, eastBox.y + eastBox.height / 2, { steps: 8 });
  await page.mouse.up();

  const sizeInput = page.locator('#devnotes-beta3 .font-size');
  const startingSize = Number.parseFloat(await sizeInput.inputValue());
  await sizeInput.fill(String(startingSize + 8));
  await page.locator('#devnotes-beta3 .text-transform').selectOption('uppercase');
  await page.locator('#devnotes-beta3 .edit-copy').click();
  await page.locator('#devnotes-beta3').evaluate((host) => {
    const frame = host.shadowRoot.querySelector('.frame');
    const doc = frame.contentDocument;
    const textNode = [...doc.querySelector('h1').querySelectorAll('span')]
      .find((element) => element.textContent.includes('research')).firstChild;
    const range = doc.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 'research'.length);
    const selection = frame.contentWindow.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    doc.dispatchEvent(new Event('selectionchange'));
  });
  await page.locator('#devnotes-beta3 .format-bold').click();
  const inlineFormatting = await page.locator('#devnotes-beta3').evaluate((host) => host.shadowRoot.querySelector('.frame').contentDocument.querySelector('h1').innerHTML);
  assert.match(inlineFormatting, /<(b|strong)[^>]*>research<\/(b|strong)>/i);
  assert.doesNotMatch(inlineFormatting, /^<(b|strong)[^>]*>/i);
  await page.locator('#devnotes-beta3 .edit-copy').click();
  await page.locator('#devnotes-beta3 .edit-copy').click();
  await page.keyboard.type('Beta 3 proof headline');
  await page.keyboard.press('Escape');

  const experiment = await page.locator('#devnotes-beta3').evaluate((host) => {
    const heading = host.shadowRoot.querySelector('.frame').contentDocument.querySelector('h1');
    const rect = heading.getBoundingClientRect();
    return { x: rect.x, width: rect.width, text: heading.textContent, state: window.__devNotesBeta3.state() };
  });
  assert.equal(experiment.text, 'Beta 3 proof headline');
  assert.ok(Math.abs(experiment.x - movedHeading.x) < 1);
  assert.ok(experiment.width > headingBefore.width + 70);
  assert.deepEqual(experiment.state.history.map((operation) => operation.type), [
    'move-layer',
    'resize-layer',
    'format-text',
    'format-text',
    'format-inline-text',
    'edit-copy',
  ]);

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
    operations: ['move-layer', 'resize-layer', 'format-text', 'format-inline-text', 'edit-copy'],
    originalText,
    sourceUnchanged: after === before,
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
