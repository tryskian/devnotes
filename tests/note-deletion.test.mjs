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

test('deleted notes stay recoverable and can be restored', async (context) => {
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

  const createResponse = await fetch(`${origin}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'http://127.0.0.1:4331/',
      title: 'Temporary test',
      note: 'Temporary deletion test',
      viewport: { width: 100, height: 100, devicePixelRatio: 1, scrollX: 0, scrollY: 0 },
      selection: {
        type: 'rectangle',
        color: '#111111',
        points: [{ x: 1, y: 1 }, { x: 20, y: 20 }],
        bounds: { left: 1, top: 1, width: 19, height: 19 },
      },
      elements: [],
    }),
  });
  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();

  const deleteResponse = await fetch(`${origin}/api/notes/${created.note.id}`, { method: 'DELETE' });
  assert.equal(deleteResponse.status, 200);
  const deleted = await deleteResponse.json();
  assert.equal(deleted.recoverable, true);
  assert.equal(deleted.note.status, 'deleted');

  const visible = await (await fetch(`${origin}/api/notes`)).json();
  assert.deepEqual(visible.notes, []);

  const trash = await (await fetch(`${origin}/api/notes?includeDeleted=1`)).json();
  assert.equal(trash.notes.length, 1);
  assert.equal(trash.notes[0].status, 'deleted');

  const restoreResponse = await fetch(`${origin}/api/notes/${created.note.id}/restore`, { method: 'POST' });
  assert.equal(restoreResponse.status, 200);
  const restored = await restoreResponse.json();
  assert.equal(restored.note.status, 'open');
  assert.equal('deletedAt' in restored.note, false);

  const visibleAgain = await (await fetch(`${origin}/api/notes`)).json();
  assert.equal(visibleAgain.notes.length, 1);
  assert.equal(visibleAgain.notes[0].id, created.note.id);
});
