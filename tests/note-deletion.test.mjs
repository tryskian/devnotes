import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';

const port = 4348;
const origin = `http://127.0.0.1:${port}`;

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${origin}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('test server did not become ready');
}

function notePayload(url, note) {
  return {
    url,
    title: 'Temporary test',
    note,
    viewport: { width: 100, height: 100, devicePixelRatio: 1, scrollX: 0, scrollY: 0 },
    selection: {
      type: 'rectangle',
      color: '#111111',
      points: [{ x: 1, y: 1 }, { x: 20, y: 20 }],
      bounds: { left: 1, top: 1, width: 19, height: 19 },
    },
    elements: [],
  };
}

async function createNote(url, note) {
  const response = await fetch(`${origin}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notePayload(url, note)),
  });
  assert.equal(response.status, 201);
  return (await response.json()).note;
}

test('notes can be edited, deleted, and cleared by page', async (context) => {
  const dataDirectory = await mkdtemp(join(tmpdir(), 'live-annotation-test-'));
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      ANNOTATION_PORT: String(port),
      ANNOTATION_DATA_DIR: dataDirectory,
    },
    stdio: 'ignore',
  });

  context.after(async () => {
    child.kill();
    await rm(dataDirectory, { recursive: true, force: true });
  });

  await waitForServer();

  const preflightResponse = await fetch(`${origin}/api/notes/test-note`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://127.0.0.1:4331',
      'Access-Control-Request-Method': 'DELETE',
    },
  });
  assert.equal(preflightResponse.status, 204);
  assert.match(preflightResponse.headers.get('access-control-allow-methods') || '', /DELETE/);
  assert.match(preflightResponse.headers.get('access-control-allow-methods') || '', /PATCH/);

  const pageA = 'http://127.0.0.1:4331/';
  const pageB = 'http://127.0.0.1:4331/about/';
  const created = await createNote(pageA, 'Temporary deletion test');

  const editResponse = await fetch(`${origin}/api/notes/${created.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: 'Edited note text' }),
  });
  assert.equal(editResponse.status, 200);
  const edited = (await editResponse.json()).note;
  assert.equal(edited.id, created.id);
  assert.equal(edited.createdAt, created.createdAt);
  assert.deepEqual(edited.selection, created.selection);
  assert.equal(edited.note, 'Edited note text');
  assert.equal(typeof edited.updatedAt, 'string');

  const deleteResponse = await fetch(`${origin}/api/notes/${created.id}`, { method: 'DELETE' });
  assert.equal(deleteResponse.status, 200);
  const deleted = await deleteResponse.json();
  assert.equal(deleted.permanent, true);
  assert.equal(deleted.note.id, created.id);

  const visible = await (await fetch(`${origin}/api/notes`)).json();
  assert.deepEqual(visible.notes, []);

  const secondDelete = await fetch(`${origin}/api/notes/${created.id}`, { method: 'DELETE' });
  assert.equal(secondDelete.status, 404);

  await createNote(pageA, 'Page A note one');
  await createNote(pageA, 'Page A note two');
  const pageBNote = await createNote(pageB, 'Page B note');

  const clearResponse = await fetch(`${origin}/api/notes?url=${encodeURIComponent(pageA)}`, { method: 'DELETE' });
  assert.equal(clearResponse.status, 200);
  const cleared = await clearResponse.json();
  assert.equal(cleared.deletedCount, 2);
  assert.equal(cleared.pageUrl, pageA);
  assert.equal(cleared.permanent, true);

  const pageANotes = await (await fetch(`${origin}/api/notes?url=${encodeURIComponent(pageA)}`)).json();
  assert.deepEqual(pageANotes.notes, []);

  const pageBNotes = await (await fetch(`${origin}/api/notes?url=${encodeURIComponent(pageB)}`)).json();
  assert.equal(pageBNotes.notes.length, 1);
  assert.equal(pageBNotes.notes[0].id, pageBNote.id);

  const clearWithoutPage = await fetch(`${origin}/api/notes`, { method: 'DELETE' });
  assert.equal(clearWithoutPage.status, 422);
});
