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

test('working notes, replies, snapshots, restore, deletion, and page clearing', async (context) => {
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

  const defaultPreferences = await (await fetch(`${origin}/api/preferences`)).json();
  assert.deepEqual(defaultPreferences.preferences, { color: '#111111', tool: 'polygon' });

  const preferenceResponse = await fetch(`${origin}/api/preferences`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ color: '#f20707', tool: 'text' }),
  });
  assert.equal(preferenceResponse.status, 200);
  const savedPreferences = await preferenceResponse.json();
  assert.deepEqual(savedPreferences.preferences, { color: '#f20707', tool: 'text' });

  const pageA = 'http://127.0.0.1:4331/';
  const pageB = 'http://127.0.0.1:4331/about/';
  const created = await createNote(pageA, 'Temporary deletion test');

  const firstSelection = created.selection;
  const secondSelection = {
    type: 'arrow',
    color: '#02c6f7',
    points: [{ x: 30, y: 30 }, { x: 70, y: 10 }],
    bounds: { left: 30, top: 10, width: 40, height: 20 },
    elements: [],
    pointAnchors: [null, null],
  };
  const groupedResponse = await fetch(`${origin}/api/notes/${created.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selections: [firstSelection, secondSelection] }),
  });
  assert.equal(groupedResponse.status, 200);
  const grouped = (await groupedResponse.json()).note;
  assert.equal(grouped.selections.length, 2);
  assert.deepEqual(grouped.selection, firstSelection);
  assert.equal(grouped.selections[1].type, 'arrow');
  assert.equal(grouped.selections[1].color, '#02c6f7');

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
  assert.equal(edited.selections.length, 2);
  assert.equal(edited.note, 'Edited note text');
  assert.equal(typeof edited.updatedAt, 'string');

  const replyResponse = await fetch(`${origin}/api/notes/${created.id}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author: 'human', text: 'A first reply' }),
  });
  assert.equal(replyResponse.status, 201);
  const replied = await replyResponse.json();
  assert.equal(replied.note.replies.length, 1);
  assert.equal(replied.note.replies[0].author, 'human');
  assert.equal(replied.note.replies[0].text, 'A first reply');

  const notieReplyResponse = await fetch(`${origin}/api/notes/${created.id}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author: 'notie', text: 'A Notie reply' }),
  });
  assert.equal(notieReplyResponse.status, 201);
  const notieReplied = await notieReplyResponse.json();
  assert.equal(notieReplied.note.replies.length, 2);
  assert.equal(notieReplied.note.replies[1].author, 'notie');
  assert.equal(notieReplied.note.replies[1].text, 'A Notie reply');

  const thumbnailResponse = await fetch(`${origin}/api/thumbnails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      noteId: created.id,
      noteNumber: created.number,
      url: pageA,
      width: 1440,
      height: 900,
      viewport: { width: 1440, height: 900, devicePixelRatio: 1 },
      dataUrl: 'data:image/jpeg;base64,dGVzdA==',
    }),
  });
  assert.equal(thumbnailResponse.status, 200);
  const thumbnail = (await thumbnailResponse.json()).thumbnail;
  assert.equal(thumbnail.noteId, created.id);
  assert.equal(thumbnail.selectionCount, 2);
  assert.equal(typeof thumbnail.sourceRevision, 'number');

  const snapshotResponse = await fetch(`${origin}/api/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label: 'Before another edit' }),
  });
  assert.equal(snapshotResponse.status, 201);
  const snapshot = (await snapshotResponse.json()).snapshot;
  assert.equal(snapshot.label, 'Before another edit');
  assert.equal(snapshot.noteCount, 1);
  assert.equal(snapshot.pageCount, 1);

  const laterEditResponse = await fetch(`${origin}/api/notes/${created.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: 'Changed after snapshot' }),
  });
  assert.equal(laterEditResponse.status, 200);

  const immutableSnapshot = await (await fetch(`${origin}/api/snapshots/${snapshot.id}`)).json();
  assert.equal(immutableSnapshot.snapshot.notes[0].note, 'Edited note text');
  assert.equal(immutableSnapshot.snapshot.notes[0].replies.length, 2);
  assert.equal(immutableSnapshot.snapshot.notes[0].selections.length, 2);
  assert.deepEqual(immutableSnapshot.snapshot.preferences, { color: '#f20707', tool: 'text' });
  assert.equal(immutableSnapshot.snapshot.thumbnails[0].dataUrl, 'data:image/jpeg;base64,dGVzdA==');

  const restoreResponse = await fetch(`${origin}/api/snapshots/${snapshot.id}/restore`, { method: 'POST' });
  assert.equal(restoreResponse.status, 200);
  const restored = await restoreResponse.json();
  assert.equal(restored.restored.id, snapshot.id);
  assert.equal(restored.safetySnapshot.reason, 'before-restore');

  const restoredNotes = await (await fetch(`${origin}/api/notes`)).json();
  assert.equal(restoredNotes.notes[0].note, 'Edited note text');
  assert.equal(restoredNotes.notes[0].replies[0].text, 'A first reply');
  assert.equal(restoredNotes.notes[0].replies[1].text, 'A Notie reply');
  assert.equal(restoredNotes.notes[0].selections[1].type, 'arrow');
  const restoredThumbnails = await (await fetch(`${origin}/api/thumbnails`)).json();
  assert.equal(restoredThumbnails.thumbnails[0].noteId, created.id);

  const snapshotsAfterRestore = await (await fetch(`${origin}/api/snapshots`)).json();
  assert.equal(snapshotsAfterRestore.snapshots.length, 2);

  const workingNotebook = await (await fetch(`${origin}/api/notebook`)).json();
  assert.equal(workingNotebook.notebook.noteCount, 1);
  assert.equal(workingNotebook.notebook.pageCount, 1);
  assert.equal(typeof workingNotebook.notebook.revision, 'number');

  const deleteResponse = await fetch(`${origin}/api/notes/${created.id}`, { method: 'DELETE' });
  assert.equal(deleteResponse.status, 200);
  const deleted = await deleteResponse.json();
  assert.equal(deleted.permanent, true);
  assert.equal(deleted.note.id, created.id);

  const visible = await (await fetch(`${origin}/api/notes`)).json();
  assert.deepEqual(visible.notes, []);
  const thumbnailsAfterDelete = await (await fetch(`${origin}/api/thumbnails`)).json();
  assert.deepEqual(thumbnailsAfterDelete.thumbnails, []);

  const secondDelete = await fetch(`${origin}/api/notes/${created.id}`, { method: 'DELETE' });
  assert.equal(secondDelete.status, 404);

  await createNote(pageA, 'Page A note one');
  await createNote(pageA, 'Page A note two');
  const textPayload = notePayload(pageA, 'Page A text note');
  textPayload.selection = {
    type: 'text',
    color: '#f20707',
    quote: 'Selected live text',
    rects: [{ left: 10, top: 10, width: 100, height: 20 }],
    points: [{ x: 10, y: 10 }, { x: 110, y: 30 }],
    bounds: { left: 10, top: 10, width: 100, height: 20 },
    range: { startPath: [0], startOffset: 0, endPath: [0], endOffset: 18, prefix: '', suffix: '' },
  };
  const textCreateResponse = await fetch(`${origin}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(textPayload),
  });
  assert.equal(textCreateResponse.status, 201);
  const pageBNote = await createNote(pageB, 'Page B note');

  const clearResponse = await fetch(`${origin}/api/notes?url=${encodeURIComponent(pageA)}`, { method: 'DELETE' });
  assert.equal(clearResponse.status, 200);
  const cleared = await clearResponse.json();
  assert.equal(cleared.deletedCount, 3);
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
