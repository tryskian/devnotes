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
  await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.locator('main').waitFor({ state: 'visible', timeout: 30_000 });
  // Hosted preview surfaces can report their own delayed network errors. The
  // verification boundary begins after the target has rendered and before
  // Beta 3 is injected, so only errors introduced by Beta 3 fail this run.
  errors.length = 0;
  const before = await page.locator('main').evaluate((element) => element.outerHTML);
  const originalText = await page.locator('h1').innerText();
  await page.addScriptTag({ url: `${origin}/beta3.js` });
  await page.waitForFunction(() => window.__devNotesBeta3?.state().layers > 0);
  const frozenState = await page.evaluate(() => window.__devNotesBeta3.state());

  const initialUi = await page.locator('#devnotes-beta3').evaluate((host) => {
    const root = host.shadowRoot;
    return {
      toolbarHidden: root.querySelector('.topbar').hidden,
      controlsHidden: root.querySelector('.inspector').hidden,
      controlsBodyHidden: root.querySelector('.inspector-body').hidden,
      emptyCopy: root.querySelector('.inspector-empty').textContent.trim(),
      state: window.__devNotesBeta3.state().ui,
    };
  });
  assert.equal(initialUi.toolbarHidden, false);
  assert.equal(initialUi.controlsHidden, false);
  assert.equal(initialUi.controlsBodyHidden, true);
  assert.match(initialUi.emptyCopy, /Click a rendered element/);
  assert.deepEqual(initialUi.state, { toolbarVisible: true, controlsVisible: true });

  const toolbarBefore = await page.locator('#devnotes-beta3 .topbar').boundingBox();
  const brandBox = await page.locator('#devnotes-beta3 .brand').boundingBox();
  assert.ok(toolbarBefore && brandBox);
  await page.mouse.move(brandBox.x + brandBox.width / 2, brandBox.y + brandBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(brandBox.x + brandBox.width / 2 - 120, brandBox.y + brandBox.height / 2 + 48, { steps: 6 });
  await page.mouse.up();
  const toolbarAfter = await page.locator('#devnotes-beta3 .topbar').boundingBox();
  assert.ok(toolbarAfter);
  assert.ok(Math.abs(toolbarAfter.x - toolbarBefore.x) > 20 || Math.abs(toolbarAfter.y - toolbarBefore.y) > 20);

  const controlsBefore = await page.locator('#devnotes-beta3 .inspector').boundingBox();
  const controlsHandle = await page.locator('#devnotes-beta3 .inspector-header').boundingBox();
  assert.ok(controlsBefore && controlsHandle);
  await page.mouse.move(controlsHandle.x + 40, controlsHandle.y + 18);
  await page.mouse.down();
  await page.mouse.move(controlsHandle.x - 90, controlsHandle.y + 75, { steps: 6 });
  await page.mouse.up();
  const controlsAfter = await page.locator('#devnotes-beta3 .inspector').boundingBox();
  assert.ok(controlsAfter);
  assert.ok(Math.abs(controlsAfter.x - controlsBefore.x) > 20 || Math.abs(controlsAfter.y - controlsBefore.y) > 20);

  await page.locator('#devnotes-beta3 .toggle-controls').click();
  assert.equal(await page.locator('#devnotes-beta3').evaluate((host) => host.shadowRoot.querySelector('.inspector').hidden), true);
  assert.equal(await page.locator('#devnotes-beta3 .ui-reveal').textContent(), 'Show controls');
  await page.locator('#devnotes-beta3 .ui-reveal').click();
  await page.locator('#devnotes-beta3 .hide-toolbar').click();
  assert.equal(await page.locator('#devnotes-beta3').evaluate((host) => host.shadowRoot.querySelector('.topbar').hidden), true);
  assert.equal(await page.locator('#devnotes-beta3 .ui-reveal').textContent(), 'Show toolbar');
  await page.locator('#devnotes-beta3 .ui-reveal').click();
  await page.locator('#devnotes-beta3 .hide-ui').click();
  assert.deepEqual(await page.locator('#devnotes-beta3').evaluate((host) => ({
    toolbar: host.shadowRoot.querySelector('.topbar').hidden,
    controls: host.shadowRoot.querySelector('.inspector').hidden,
    reveal: host.shadowRoot.querySelector('.ui-reveal').textContent,
  })), { toolbar: true, controls: true, reveal: 'Show UI' });
  await page.locator('#devnotes-beta3 .ui-reveal').click();
  await page.locator('#devnotes-beta3 .toggle-controls').click();

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
    return { x: rect.x, width: rect.width, translate: heading.style.translate };
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
  await page.locator('#devnotes-beta3 .ui-reveal').click();

  const sizeInput = page.locator('#devnotes-beta3 .font-size');
  const startingSize = Number.parseFloat(await sizeInput.inputValue());
  await page.locator('#devnotes-beta3 [data-size-delta="8"]').click();
  assert.ok(Math.abs(Number.parseFloat(await sizeInput.inputValue()) - (startingSize + 8)) < 0.2);
  await page.locator('#devnotes-beta3 .text-transform').selectOption('uppercase');
  await page.locator('#devnotes-beta3 .css-property').fill('color');
  await page.locator('#devnotes-beta3 .css-read').click();
  assert.notEqual((await page.locator('#devnotes-beta3 .css-value').inputValue()).trim(), '');
  await page.locator('#devnotes-beta3 .css-property').fill('opacity');
  await page.locator('#devnotes-beta3 .css-value').fill('0.92');
  await page.locator('#devnotes-beta3 .apply-css').click();
  assert.equal(await page.locator('#devnotes-beta3').evaluate((host) => host.shadowRoot.querySelector('.frame').contentDocument.querySelector('h1').style.opacity), '0.92');
  await page.locator('#devnotes-beta3 [data-css-remove="opacity"]').click();
  assert.equal(await page.locator('#devnotes-beta3').evaluate((host) => host.shadowRoot.querySelector('.frame').contentDocument.querySelector('h1').style.opacity), '');
  await page.locator('#devnotes-beta3 .edit-copy').click();
  await page.locator('#devnotes-beta3').evaluate((host) => {
    const frame = host.shadowRoot.querySelector('.frame');
    const doc = frame.contentDocument;
    const walker = doc.createTreeWalker(doc.querySelector('h1'), 4);
    let textNode = walker.nextNode();
    while (textNode && textNode.textContent.trim().length < 3) textNode = walker.nextNode();
    if (!textNode) throw new Error('No selectable heading text was captured.');
    const range = doc.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, Math.min(8, textNode.textContent.length));
    const selection = frame.contentWindow.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    doc.dispatchEvent(new Event('selectionchange'));
  });
  await page.locator('#devnotes-beta3 .format-bold').click();
  const inlineFormatting = await page.locator('#devnotes-beta3').evaluate((host) => host.shadowRoot.querySelector('.frame').contentDocument.querySelector('h1').innerHTML);
  assert.match(inlineFormatting, /<(b|strong)[^>]*>[^<]+<\/(b|strong)>/i);
  assert.match(inlineFormatting, /<\/(b|strong)>\s*\S/i);
  await page.locator('#devnotes-beta3 .edit-copy').click();
  await page.locator('#devnotes-beta3 .edit-copy').click();
  await page.keyboard.type('Beta 3 proof headline');
  await page.keyboard.press('Escape');

  const experiment = await page.locator('#devnotes-beta3').evaluate((host) => {
    const heading = host.shadowRoot.querySelector('.frame').contentDocument.querySelector('h1');
    const rect = heading.getBoundingClientRect();
    return { x: rect.x, width: rect.width, translate: heading.style.translate, text: heading.textContent, state: window.__devNotesBeta3.state() };
  });
  assert.equal(experiment.text, 'Beta 3 proof headline');
  assert.equal(experiment.translate, movedHeading.translate);
  assert.ok(experiment.width > movedHeading.width + 70);
  assert.deepEqual(experiment.state.history.map((operation) => operation.type), [
    'move-layer',
    'resize-layer',
    'format-text',
    'format-text',
    'set-css-property',
    'remove-css-property',
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
    operations: ['move-layer', 'resize-layer', 'format-text', 'set-css-property', 'remove-css-property', 'format-inline-text', 'edit-copy'],
    originalText,
    sourceUnchanged: after === before,
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
