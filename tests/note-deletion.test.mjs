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

test('deleting a note permanently removes it from the ledger', async (context) => {
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
  assert.equal(deleted.permanent, true);
  assert.equal(deleted.note.id, created.note.id);

  const visible = await (await fetch(`${origin}/api/notes`)).json();
  assert.deepEqual(visible.notes, []);

  const secondDelete = await fetch(`${origin}/api/notes/${created.note.id}`, { method: 'DELETE' });
  assert.equal(secondDelete.status, 404);
});
