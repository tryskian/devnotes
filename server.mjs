import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const clientPath = join(root, 'public', 'client.js');
const dataDirectory = process.env.ANNOTATION_DATA_DIR
  ? resolve(process.env.ANNOTATION_DATA_DIR)
  : join(root, '.data');
const notesPath = join(dataDirectory, 'notes.json');
const preferencesPath = join(dataDirectory, 'preferences.json');
const notebookPath = join(dataDirectory, 'notebook.json');
const snapshotsPath = join(dataDirectory, 'snapshots.json');
const port = Number.parseInt(process.env.ANNOTATION_PORT || '4347', 10);
const host = '127.0.0.1';

await mkdir(dataDirectory, { recursive: true });

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

async function readNotes() {
  try {
    const value = JSON.parse(await readFile(notesPath, 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeNotes(notes) {
  const temporaryPath = `${notesPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(notes, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, notesPath);
}

async function readPreferences() {
  try {
    const value = JSON.parse(await readFile(preferencesPath, 'utf8'));
    return {
      color: /^#[0-9a-f]{6}$/i.test(value?.color || '') ? value.color : '#111111',
      tool: typeof value?.tool === 'string' ? value.tool : 'polygon',
    };
  } catch (error) {
    if (error?.code === 'ENOENT') return { color: '#111111', tool: 'polygon' };
    throw error;
  }
}

async function writePreferences(preferences) {
  const temporaryPath = `${preferencesPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(preferences, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, preferencesPath);
}

async function readNotebook(notes = null) {
  try {
    const value = JSON.parse(await readFile(notebookPath, 'utf8'));
    return {
      schemaVersion: 2,
      revision: Number.isInteger(value?.revision) ? value.revision : 0,
      nextNoteNumber: Number.isInteger(value?.nextNoteNumber) ? value.nextNoteNumber : 1,
      nextSnapshotNumber: Number.isInteger(value?.nextSnapshotNumber) ? value.nextSnapshotNumber : 1,
      updatedAt: typeof value?.updatedAt === 'string' ? value.updatedAt : null,
    };
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    const currentNotes = notes || await readNotes();
    const latestTimestamp = currentNotes
      .map((note) => note.updatedAt || note.createdAt)
      .filter(Boolean)
      .sort()
      .at(-1) || null;
    return {
      schemaVersion: 2,
      revision: currentNotes.length ? 1 : 0,
      nextNoteNumber: Math.max(0, ...currentNotes.map((note) => Number(note.number) || 0)) + 1,
      nextSnapshotNumber: 1,
      updatedAt: latestTimestamp,
    };
  }
}

async function writeNotebook(notebook) {
  const temporaryPath = `${notebookPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(notebook, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, notebookPath);
}

async function readSnapshots() {
  try {
    const value = JSON.parse(await readFile(snapshotsPath, 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeSnapshots(snapshots) {
  const temporaryPath = `${snapshotsPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(snapshots, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, snapshotsPath);
}

function pageCount(notes) {
  return new Set(notes.map((note) => note.url).filter(Boolean)).size;
}

function snapshotSummary(snapshot) {
  return {
    id: snapshot.id,
    number: snapshot.number,
    label: snapshot.label,
    createdAt: snapshot.createdAt,
    reason: snapshot.reason,
    sourceRevision: snapshot.sourceRevision,
    noteCount: snapshot.noteCount,
    pageCount: snapshot.pageCount,
  };
}

async function saveWorkingMutation(notes, notebook) {
  const nextNotebook = {
    ...notebook,
    revision: notebook.revision + 1,
    updatedAt: new Date().toISOString(),
  };
  await writeNotes(notes);
  await writeNotebook(nextNotebook);
  return nextNotebook;
}

async function createSnapshot({ label = '', reason = 'manual' } = {}) {
  const notes = await readNotes();
  const preferences = await readPreferences();
  const notebook = await readNotebook(notes);
  const snapshots = await readSnapshots();
  const snapshot = {
    id: randomUUID(),
    number: notebook.nextSnapshotNumber,
    label: String(label || '').trim().slice(0, 200) || `Snapshot ${notebook.nextSnapshotNumber}`,
    createdAt: new Date().toISOString(),
    reason,
    sourceRevision: notebook.revision,
    noteCount: notes.length,
    pageCount: pageCount(notes),
    notes: structuredClone(notes),
    preferences: structuredClone(preferences),
  };
  snapshots.push(snapshot);
  await writeSnapshots(snapshots);
  await writeNotebook({ ...notebook, nextSnapshotNumber: notebook.nextSnapshotNumber + 1 });
  return snapshot;
}

function json(response, status, body) {
  response.writeHead(status, {
    ...headers,
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error('body_too_large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function validNote(input) {
  const type = input?.selection?.type;
  const minimumPoints = type === 'polygon' || type === 'lasso' ? 3 : 2;
  const allowedTypes = ['polygon', 'lasso', 'rectangle', 'ellipse', 'line', 'arrow', 'double-arrow', 'highlight', 'text'];
  return input
    && typeof input.url === 'string'
    && input.url.length <= 4_096
    && typeof input.note === 'string'
    && input.note.trim().length > 0
    && input.note.length <= 20_000
    && Array.isArray(input.selection?.points)
    && allowedTypes.includes(type)
    && input.selection.points.length >= minimumPoints
    && /^#[0-9a-f]{6}$/i.test(input.selection?.color || '#111111')
    && (type !== 'text' || (typeof input.selection?.quote === 'string' && input.selection.quote.length > 0 && Array.isArray(input.selection?.rects)));
}

const bookmarklet = "javascript:(()=>{const old=document.getElementById('devnotes-loader')||document.getElementById('live-interface-annotation-loader');if(old)old.remove();const s=document.createElement('script');s.id='devnotes-loader';s.src='http://127.0.0.1:4347/client.js';document.documentElement.append(s)})()";

function loaderPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>DevNotes</title>
  <style>
    :root{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#050505;background:#fefefe}
    *{box-sizing:border-box}body{margin:0;min-height:100svh;padding:clamp(1.25rem,5vw,4rem);display:grid;align-content:space-between;gap:4rem}
    header,main,footer{width:min(72rem,100%)}header{display:flex;justify-content:space-between;gap:1rem;padding-bottom:1rem;border-bottom:1px solid}
    .label,.eyebrow{text-transform:uppercase;letter-spacing:.08em}h1{max-width:14ch;margin:0 0 1.25rem;font:500 clamp(2.5rem,7vw,5.5rem)/.96 Georgia,serif}h2{margin:0;font-size:1rem;text-transform:uppercase;letter-spacing:.08em}
    p,li,label,input{font-size:clamp(.85rem,1.3vw,1rem);line-height:1.55}.lede{max-width:64ch}.notebook{display:grid;grid-template-columns:minmax(0,1fr) minmax(18rem,.72fr);gap:clamp(2rem,6vw,5rem);margin-top:clamp(3rem,8vw,7rem)}
    .surface{border-top:1px solid;padding-top:1rem}.surface-heading{display:flex;justify-content:space-between;gap:1rem;align-items:baseline}.working-summary{margin:2rem 0;color:#555}.snapshot-form{display:grid;grid-template-columns:1fr auto;gap:.65rem;margin-top:1.25rem}.snapshot-form input{min-width:0;border:0;border-bottom:1px solid;padding:.7rem 0;background:transparent}.snapshot-form button{border:0;border-bottom:1px solid;padding:.7rem .1rem}
    .snapshot-list{display:grid;gap:0;margin:1.2rem 0 0;padding:0;list-style:none}.snapshot-item{display:grid;grid-template-columns:2.5rem 1fr auto;gap:.8rem;align-items:start;padding:.9rem 0;border-top:1px solid #ddd}.snapshot-item:last-child{border-bottom:1px solid #ddd}.snapshot-number,.snapshot-meta{color:#666;font-size:.72rem}.snapshot-label{display:block;margin-bottom:.25rem}.snapshot-item button{border:0;padding:.15rem 0;text-decoration:underline;text-underline-offset:3px}.empty{color:#777;font-size:.8rem}
    .actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}a,button{border:1px solid #050505;border-radius:0;padding:.8rem 1rem;background:#fefefe;color:#050505;font:600 .78rem/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-decoration:none;text-transform:uppercase;letter-spacing:.06em;cursor:pointer}a:hover,button:hover{background:#050505;color:#fefefe}button:disabled{opacity:.4;cursor:not-allowed}code{font:inherit;background:#eee;padding:.1em .25em}.status{min-height:1.5em;color:#555;font-size:.75rem}.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}footer{padding-top:1rem;border-top:1px solid;font-size:.75rem;color:#555}
    @media(max-width:760px){.notebook{grid-template-columns:1fr}.snapshot-form{grid-template-columns:1fr}.snapshot-form button{justify-self:start}}
  </style>
</head>
<body>
  <header><span class="label">DevNotes Beta 2</span><span id="working-status">Opening notebook…</span></header>
  <main>
    <h1>Draw on the live page.</h1>
    <p class="lede">The working notebook autosaves every note, reply, edit and deletion. Save an immutable snapshot whenever you want a deliberate boundary.</p>
    <div class="notebook">
      <section class="surface" aria-labelledby="working-title">
        <div class="surface-heading"><h2 id="working-title">Working notebook</h2><span class="eyebrow">Autosaved</span></div>
        <p id="working-summary" class="working-summary">Reading working state…</p>
        <form id="snapshot-form" class="snapshot-form">
          <label class="visually-hidden" for="snapshot-label">Snapshot name</label>
          <input id="snapshot-label" maxlength="200" placeholder="Snapshot name (optional)">
          <button type="submit">Save snapshot</button>
        </form>
        <p id="snapshot-status" class="status" role="status"></p>
      </section>
      <section class="surface" aria-labelledby="snapshots-title">
        <div class="surface-heading"><h2 id="snapshots-title">Snapshots</h2><span id="snapshot-count" class="eyebrow">0</span></div>
        <ol id="snapshot-list" class="snapshot-list"></ol>
      </section>
    </div>
    <div class="actions">
      <a href="${bookmarklet}">Load DevNotes</a>
      <button type="button" id="copy">Copy loader</button>
      <a href="http://127.0.0.1:4331/">Open local portfolio</a>
    </div>
  </main>
  <footer>DevTools, but for noties · private loopback service · 127.0.0.1:4347</footer>
  <script>
    const list=document.querySelector('#snapshot-list');
    const status=document.querySelector('#snapshot-status');
    const form=document.querySelector('#snapshot-form');
    const label=document.querySelector('#snapshot-label');
    function when(value){if(!value)return'Not changed yet';return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}
    function counted(value,singular){return value+' '+singular+(value===1?'':'s');}
    async function request(path,options){const response=await fetch(path,options);const result=await response.json();if(!response.ok||result.ok===false)throw new Error(result.error||('Request failed '+response.status));return result;}
    async function refresh(){
      const [working,snapshots]=await Promise.all([request('/api/notebook'),request('/api/snapshots')]);
      document.querySelector('#working-status').textContent=counted(working.notebook.noteCount,'note')+' · '+counted(working.notebook.pageCount,'page');
      document.querySelector('#working-summary').textContent='Revision '+working.notebook.revision+' · '+counted(working.notebook.noteCount,'note')+' across '+counted(working.notebook.pageCount,'page')+' · '+when(working.notebook.updatedAt);
      document.querySelector('#snapshot-count').textContent=String(snapshots.snapshots.length);
      list.replaceChildren();
      if(!snapshots.snapshots.length){const empty=document.createElement('li');empty.className='empty';empty.textContent='No snapshots yet.';list.append(empty);return;}
      for(const snapshot of snapshots.snapshots.slice().reverse()){
        const item=document.createElement('li');item.className='snapshot-item';
        const number=document.createElement('span');number.className='snapshot-number';number.textContent=String(snapshot.number).padStart(2,'0');
        const body=document.createElement('div');const title=document.createElement('strong');title.className='snapshot-label';title.textContent=snapshot.label;const meta=document.createElement('span');meta.className='snapshot-meta';meta.textContent=when(snapshot.createdAt)+' · '+counted(snapshot.noteCount,'note')+' · '+counted(snapshot.pageCount,'page');body.append(title,meta);
        const restore=document.createElement('button');restore.type='button';restore.textContent='Restore';restore.addEventListener('click',async()=>{if(!confirm('Restore snapshot '+snapshot.number+' as the new working notebook? The current state will be snapshotted first.'))return;status.textContent='Restoring…';try{await request('/api/snapshots/'+encodeURIComponent(snapshot.id)+'/restore',{method:'POST'});status.textContent='Restored as new working notebook.';await refresh();}catch(error){status.textContent=error.message;}});
        item.append(number,body,restore);list.append(item);
      }
    }
    form.addEventListener('submit',async(event)=>{event.preventDefault();status.textContent='Saving snapshot…';try{await request('/api/snapshots',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label:label.value})});label.value='';status.textContent='Snapshot saved.';await refresh();}catch(error){status.textContent=error.message;}});
    document.querySelector('#copy').addEventListener('click',async(event)=>{await navigator.clipboard.writeText(${JSON.stringify(bookmarklet)});event.currentTarget.textContent='Copied';});
    refresh().catch(error=>{status.textContent=error.message;});
  </script>
</body>
</html>`;
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${host}:${port}`);

    if (request.method === 'OPTIONS') {
      response.writeHead(204, headers);
      response.end();
      return;
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      json(response, 200, { ok: true, service: 'devnotes' });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/') {
      response.writeHead(200, {
        ...headers,
        'Content-Type': 'text/html; charset=utf-8',
      });
      response.end(loaderPage());
      return;
    }

    if (request.method === 'GET' && url.pathname === '/client.js') {
      const source = await readFile(clientPath, 'utf8');
      response.writeHead(200, {
        ...headers,
        'Content-Type': 'text/javascript; charset=utf-8',
      });
      response.end(source);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/preferences') {
      json(response, 200, { preferences: await readPreferences() });
      return;
    }

    if (request.method === 'PATCH' && url.pathname === '/api/preferences') {
      const input = await readBody(request);
      const current = await readPreferences();
      const next = {
        color: /^#[0-9a-f]{6}$/i.test(input?.color || '') ? input.color : current.color,
        tool: ['polygon', 'rectangle', 'ellipse', 'line', 'arrow', 'double-arrow', 'highlight', 'text'].includes(input?.tool) ? input.tool : current.tool,
      };
      await writePreferences(next);
      const notes = await readNotes();
      const notebook = await saveWorkingMutation(notes, await readNotebook(notes));
      json(response, 200, { ok: true, preferences: next, revision: notebook.revision });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/notebook') {
      const notes = await readNotes();
      const notebook = await readNotebook(notes);
      json(response, 200, {
        notebook: {
          ...notebook,
          noteCount: notes.length,
          pageCount: pageCount(notes),
        },
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/snapshots') {
      const snapshots = await readSnapshots();
      json(response, 200, { snapshots: snapshots.map(snapshotSummary) });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/snapshots') {
      const input = await readBody(request);
      const snapshot = await createSnapshot({ label: input?.label, reason: 'manual' });
      json(response, 201, { ok: true, snapshot: snapshotSummary(snapshot) });
      return;
    }

    const snapshotMatch = url.pathname.match(/^\/api\/snapshots\/([^/]+)$/);
    if (request.method === 'GET' && snapshotMatch) {
      const snapshots = await readSnapshots();
      const snapshot = snapshots.find((item) => item.id === decodeURIComponent(snapshotMatch[1]));
      if (!snapshot) {
        json(response, 404, { ok: false, error: 'snapshot_not_found' });
        return;
      }
      json(response, 200, { snapshot });
      return;
    }

    const restoreMatch = url.pathname.match(/^\/api\/snapshots\/([^/]+)\/restore$/);
    if (request.method === 'POST' && restoreMatch) {
      const snapshots = await readSnapshots();
      const snapshot = snapshots.find((item) => item.id === decodeURIComponent(restoreMatch[1]));
      if (!snapshot) {
        json(response, 404, { ok: false, error: 'snapshot_not_found' });
        return;
      }
      const safety = await createSnapshot({ label: `Before restore: ${snapshot.label}`, reason: 'before-restore' });
      const currentNotes = await readNotes();
      const currentNotebook = await readNotebook(currentNotes);
      const restoredNotes = structuredClone(snapshot.notes || []);
      await writePreferences(structuredClone(snapshot.preferences || { color: '#111111', tool: 'polygon' }));
      const notebook = await saveWorkingMutation(restoredNotes, {
        ...currentNotebook,
        nextNoteNumber: Math.max(0, ...restoredNotes.map((note) => Number(note.number) || 0)) + 1,
      });
      json(response, 200, {
        ok: true,
        restored: snapshotSummary(snapshot),
        safetySnapshot: snapshotSummary(safety),
        revision: notebook.revision,
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/notes') {
      const notes = await readNotes();
      const pageUrl = url.searchParams.get('url');
      json(response, 200, {
        notes: pageUrl ? notes.filter((note) => note.url === pageUrl) : notes,
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/notes') {
      const input = await readBody(request);
      if (!validNote(input)) {
        json(response, 422, { ok: false, error: 'invalid_note' });
        return;
      }

      const notes = await readNotes();
      const notebook = await readNotebook(notes);
      const note = {
        id: randomUUID(),
        number: notebook.nextNoteNumber,
        createdAt: new Date().toISOString(),
        status: 'open',
        replies: [],
        ...input,
        note: input.note.trim(),
      };
      notes.push(note);
      const nextNotebook = await saveWorkingMutation(notes, {
        ...notebook,
        nextNoteNumber: notebook.nextNoteNumber + 1,
      });
      json(response, 201, { ok: true, note, revision: nextNotebook.revision });
      return;
    }

    if (request.method === 'DELETE' && url.pathname === '/api/notes') {
      const pageUrl = url.searchParams.get('url');
      if (!pageUrl) {
        json(response, 422, { ok: false, error: 'page_url_required' });
        return;
      }
      const notes = await readNotes();
      const kept = notes.filter((note) => note.url !== pageUrl);
      const deletedCount = notes.length - kept.length;
      const notebook = await saveWorkingMutation(kept, await readNotebook(notes));
      json(response, 200, { ok: true, deletedCount, pageUrl, permanent: true, revision: notebook.revision });
      return;
    }

    const replyMatch = url.pathname.match(/^\/api\/notes\/([^/]+)\/replies$/);
    if (request.method === 'POST' && replyMatch) {
      const input = await readBody(request);
      const text = typeof input?.text === 'string' ? input.text.trim() : '';
      const author = input?.author === 'beab' ? 'beab' : 'human';
      if (!text || text.length > 20_000) {
        json(response, 422, { ok: false, error: 'invalid_reply' });
        return;
      }
      const notes = await readNotes();
      const index = notes.findIndex((note) => note.id === decodeURIComponent(replyMatch[1]));
      if (index === -1) {
        json(response, 404, { ok: false, error: 'note_not_found' });
        return;
      }
      const replies = Array.isArray(notes[index].replies) ? notes[index].replies : [];
      if (replies.length >= 200) {
        json(response, 422, { ok: false, error: 'reply_limit_reached' });
        return;
      }
      const reply = {
        id: randomUUID(),
        author,
        text,
        createdAt: new Date().toISOString(),
      };
      notes[index] = { ...notes[index], replies: [...replies, reply], updatedAt: new Date().toISOString() };
      const notebook = await saveWorkingMutation(notes, await readNotebook(notes));
      json(response, 201, { ok: true, reply, note: notes[index], revision: notebook.revision });
      return;
    }

    const noteMatch = url.pathname.match(/^\/api\/notes\/([^/]+)$/);
    if (request.method === 'PATCH' && noteMatch) {
      const input = await readBody(request);
      if (typeof input?.note !== 'string' || input.note.trim().length === 0 || input.note.length > 20_000) {
        json(response, 422, { ok: false, error: 'invalid_note_text' });
        return;
      }
      const notes = await readNotes();
      const index = notes.findIndex((note) => note.id === decodeURIComponent(noteMatch[1]));
      if (index === -1) {
        json(response, 404, { ok: false, error: 'note_not_found' });
        return;
      }
      notes[index] = {
        ...notes[index],
        note: input.note.trim(),
        updatedAt: new Date().toISOString(),
      };
      const notebook = await saveWorkingMutation(notes, await readNotebook(notes));
      json(response, 200, { ok: true, note: notes[index], revision: notebook.revision });
      return;
    }

    if (request.method === 'DELETE' && noteMatch) {
      const notes = await readNotes();
      const index = notes.findIndex((note) => note.id === decodeURIComponent(noteMatch[1]));
      if (index === -1) {
        json(response, 404, { ok: false, error: 'note_not_found' });
        return;
      }
      const [note] = notes.splice(index, 1);
      const notebook = await saveWorkingMutation(notes, await readNotebook(notes));
      json(response, 200, { ok: true, note, permanent: true, revision: notebook.revision });
      return;
    }

    json(response, 404, { ok: false, error: 'not_found' });
  } catch (error) {
    const status = error?.message === 'body_too_large' ? 413 : 500;
    json(response, status, { ok: false, error: error?.message || 'unknown_error' });
  }
});

server.listen(port, host, () => {
  console.log(`DevNotes listening on http://${host}:${port}`);
});
