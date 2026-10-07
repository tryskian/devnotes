import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
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
const thumbnailsPath = join(dataDirectory, 'thumbnails.json');
const thumbnailCapturePath = join(root, 'scripts', 'capture-thumbnails.mjs');
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

function pageSequencesFor(notes, stored = {}) {
  const derived = {};
  for (const note of notes) {
    if (!note?.url) continue;
    derived[note.url] = Math.max(derived[note.url] || 1, (Number(note.number) || 0) + 1);
  }
  for (const [url, number] of Object.entries(stored || {})) {
    if (typeof url === 'string' && Number.isInteger(number) && number > 0) {
      derived[url] = Math.max(derived[url] || 1, number);
    }
  }
  return derived;
}

async function readNotebook(notes = null) {
  const currentNotes = notes || await readNotes();
  try {
    const value = JSON.parse(await readFile(notebookPath, 'utf8'));
    return {
      schemaVersion: 3,
      revision: Number.isInteger(value?.revision) ? value.revision : 0,
      nextNoteNumber: Number.isInteger(value?.nextNoteNumber) ? value.nextNoteNumber : 1,
      pageSequences: pageSequencesFor(currentNotes, value?.pageSequences),
      nextSnapshotNumber: Number.isInteger(value?.nextSnapshotNumber) ? value.nextSnapshotNumber : 1,
      updatedAt: typeof value?.updatedAt === 'string' ? value.updatedAt : null,
    };
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    const latestTimestamp = currentNotes
      .map((note) => note.updatedAt || note.createdAt)
      .filter(Boolean)
      .sort()
      .at(-1) || null;
    return {
      schemaVersion: 3,
      revision: currentNotes.length ? 1 : 0,
      nextNoteNumber: Math.max(0, ...currentNotes.map((note) => Number(note.number) || 0)) + 1,
      pageSequences: pageSequencesFor(currentNotes),
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

async function readThumbnails() {
  try {
    const value = JSON.parse(await readFile(thumbnailsPath, 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeThumbnails(thumbnails) {
  const temporaryPath = `${thumbnailsPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(thumbnails, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, thumbnailsPath);
}

async function removeOrphanedThumbnails(notes) {
  const noteIds = new Set(notes.map((note) => note.id));
  const thumbnails = await readThumbnails();
  const kept = thumbnails.filter((thumbnail) => noteIds.has(thumbnail.noteId));
  if (kept.length !== thumbnails.length) await writeThumbnails(kept);
  return kept;
}

function pageCount(notes) {
  return new Set(notes.map((note) => note.url).filter(Boolean)).size;
}

function pageSummaries(notes, notebook) {
  const pages = new Map();
  for (const note of notes) {
    const page = pages.get(note.url) || {
      url: note.url,
      title: note.title || note.url,
      noteCount: 0,
      latestAt: null,
    };
    page.noteCount += 1;
    page.title = note.title || page.title;
    const changedAt = note.updatedAt || note.createdAt || null;
    if (changedAt && (!page.latestAt || changedAt > page.latestAt)) page.latestAt = changedAt;
    pages.set(note.url, page);
  }
  return [...pages.values()].map((page) => ({
    ...page,
    nextNoteNumber: notebook.pageSequences?.[page.url] || 1,
  }));
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
  const thumbnails = await readThumbnails();
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
    thumbnails: structuredClone(thumbnails),
    notebookState: {
      schemaVersion: notebook.schemaVersion,
      nextNoteNumber: notebook.nextNoteNumber,
      pageSequences: structuredClone(notebook.pageSequences || {}),
    },
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
    if (size > 12_000_000) throw new Error('body_too_large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function validThumbnail(input) {
  return input
    && typeof input.noteId === 'string'
    && Number.isInteger(input.noteNumber)
    && typeof input.url === 'string'
    && input.url.length <= 4_096
    && typeof input.dataUrl === 'string'
    && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(input.dataUrl)
    && input.dataUrl.length <= 10_000_000
    && Number.isInteger(input.width)
    && input.width > 0
    && Number.isInteger(input.height)
    && input.height > 0;
}

let thumbnailCapture = null;
function refreshThumbnails() {
  if (thumbnailCapture) return thumbnailCapture;
  thumbnailCapture = new Promise((resolveCapture, rejectCapture) => {
    const child = spawn(process.execPath, [thumbnailCapturePath], {
      cwd: root,
      env: { ...process.env, DEVNOTES_ORIGIN: `http://${host}:${port}` },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', rejectCapture);
    child.on('close', (code) => {
      if (code === 0) resolveCapture(stdout.trim());
      else rejectCapture(new Error(stderr.trim() || stdout.trim() || `thumbnail_capture_failed_${code}`));
    });
  }).finally(() => { thumbnailCapture = null; });
  return thumbnailCapture;
}

function validSelection(selection) {
  const type = selection?.type;
  const minimumPoints = type === 'polygon' || type === 'lasso' ? 3 : 2;
  const allowedTypes = ['polygon', 'lasso', 'rectangle', 'ellipse', 'line', 'arrow', 'double-arrow', 'highlight', 'text'];
  return selection
    && Array.isArray(selection.points)
    && allowedTypes.includes(type)
    && selection.points.length >= minimumPoints
    && /^#[0-9a-f]{6}$/i.test(selection.color || '#111111')
    && (type !== 'text' || (typeof selection.quote === 'string' && selection.quote.length > 0 && Array.isArray(selection.rects)));
}

function selectionsFromInput(input) {
  if (Array.isArray(input?.selections) && input.selections.length) return input.selections;
  return input?.selection ? [input.selection] : [];
}

function validNote(input) {
  const selections = selectionsFromInput(input);
  return input
    && typeof input.url === 'string'
    && input.url.length <= 4_096
    && typeof input.note === 'string'
    && input.note.trim().length > 0
    && input.note.length <= 20_000
    && selections.length > 0
    && selections.length <= 32
    && selections.every(validSelection);
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
    .surface{border-top:1px solid;padding-top:1rem}.surface-heading{display:flex;justify-content:space-between;gap:1rem;align-items:baseline}.working-summary{margin:2rem 0 1rem;color:#555}.page-list{margin:0;padding:0;list-style:none;border-bottom:1px solid #ddd}.page-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;align-items:center;padding:.8rem 0;border-top:1px solid #ddd}.page-copy{min-width:0}.page-title{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.78rem}.page-meta{display:block;margin-top:.2rem;color:#777;font-size:.68rem}.page-reset{border:0;padding:.25rem 0;text-decoration:underline;text-underline-offset:3px}.snapshot-form{display:grid;grid-template-columns:1fr auto;gap:.65rem;margin-top:1.25rem}.snapshot-form input{min-width:0;border:0;border-bottom:1px solid;padding:.7rem 0;background:transparent}.snapshot-form button{border:0;border-bottom:1px solid;padding:.7rem .1rem}
    .snapshot-list{display:grid;gap:0;margin:1.2rem 0 0;padding:0;list-style:none}.snapshot-item{display:grid;grid-template-columns:2.5rem 1fr auto;gap:.8rem;align-items:start;padding:.9rem 0;border-top:1px solid #ddd}.snapshot-item:last-child{border-bottom:1px solid #ddd}.snapshot-number,.snapshot-meta{color:#666;font-size:.72rem}.snapshot-label{display:block;margin-bottom:.25rem}.snapshot-item button{border:0;padding:.15rem 0;text-decoration:underline;text-underline-offset:3px}.empty{color:#777;font-size:.8rem}
    .thumbnail-surface{grid-column:1/-1}.thumbnail-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:1px;margin-top:1.2rem;background:#050505;border:1px solid #050505}.thumbnail-card{min-width:0;background:#fefefe}.thumbnail-image{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;background:#eee;border-bottom:1px solid #050505}.thumbnail-copy{display:grid;grid-template-columns:auto 1fr auto;gap:.7rem;padding:.75rem}.thumbnail-number,.thumbnail-state{color:#666;font-size:.68rem;text-transform:uppercase;letter-spacing:.06em}.thumbnail-note{min-width:0;margin:0;font-size:.78rem;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}a,button{border:1px solid #050505;border-radius:0;padding:.8rem 1rem;background:#fefefe;color:#050505;font:600 .78rem/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-decoration:none;text-transform:uppercase;letter-spacing:.06em;cursor:pointer}a:hover,button:hover{background:#050505;color:#fefefe}button:disabled{opacity:.4;cursor:not-allowed}code{font:inherit;background:#eee;padding:.1em .25em}.status{min-height:1.5em;color:#555;font-size:.75rem}.action-notice{position:fixed;z-index:10;left:50%;bottom:max(1.25rem,env(safe-area-inset-bottom));width:min(36rem,calc(100vw - 2rem));transform:translateX(-50%);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;align-items:center;padding:.8rem .8rem .8rem 1rem;background:#fefefe;border:1px solid #050505;box-shadow:0 .6rem 1.5rem #05050518}.action-notice[hidden]{display:none}.action-message{margin:0;font-size:.78rem}.action-notice-buttons{display:flex;gap:1px;border:1px solid #050505}.action-notice-buttons[hidden]{display:none}.action-notice-buttons button{min-height:2.25rem;padding:.5rem .7rem;border:0;border-right:1px solid #050505}.action-notice-buttons button:last-child{border-right:0}.action-confirm{font-weight:700}.action-notice[data-tone="error"]{background:#050505;color:#fefefe}.action-notice[data-tone="error"] .action-notice-buttons{border-color:#fefefe}.action-notice[data-tone="error"] button{background:#050505;color:#fefefe;border-color:#fefefe}.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}footer{padding-top:1rem;border-top:1px solid;font-size:.75rem;color:#555}
    @media(max-width:760px){.notebook{grid-template-columns:1fr}.snapshot-form{grid-template-columns:1fr}.snapshot-form button{justify-self:start}.action-notice{grid-template-columns:1fr}.action-notice-buttons{justify-self:end}}
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
        <ol id="page-list" class="page-list"></ol>
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
      <section class="surface thumbnail-surface" aria-labelledby="thumbnails-title">
        <div class="surface-heading"><h2 id="thumbnails-title">Running thumbnails</h2><button id="refresh-thumbnails" type="button">Refresh captures</button></div>
        <p id="thumbnail-status" class="status" role="status"></p>
        <div id="thumbnail-list" class="thumbnail-list"></div>
      </section>
    </div>
    <div class="actions">
      <a href="${bookmarklet}">Load DevNotes</a>
      <button type="button" id="copy">Copy loader</button>
      <a href="http://127.0.0.1:4331/">Open local portfolio</a>
    </div>
  </main>
  <section id="action-notice" class="action-notice" hidden aria-live="polite"><p id="action-message" class="action-message"></p><div id="action-notice-buttons" class="action-notice-buttons" hidden><button id="action-cancel" type="button">Cancel</button><button id="action-confirm" class="action-confirm" type="button">Confirm</button></div></section>
  <footer>DevTools, but for noties · private loopback service · 127.0.0.1:4347</footer>
  <script>
    const list=document.querySelector('#snapshot-list');
    const status=document.querySelector('#snapshot-status');
    const form=document.querySelector('#snapshot-form');
    const label=document.querySelector('#snapshot-label');
    const pageList=document.querySelector('#page-list');
    const thumbnailList=document.querySelector('#thumbnail-list');
    const thumbnailStatus=document.querySelector('#thumbnail-status');
    const thumbnailButton=document.querySelector('#refresh-thumbnails');
    const actionNotice=document.querySelector('#action-notice');
    const actionMessage=document.querySelector('#action-message');
    const actionButtons=document.querySelector('#action-notice-buttons');
    const actionCancel=document.querySelector('#action-cancel');
    const actionConfirm=document.querySelector('#action-confirm');
    let actionNoticeTimer=null;
    let pendingActionNotice=null;
    function when(value){if(!value)return'Not changed yet';return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}
    function counted(value,singular){return value+' '+singular+(value===1?'':'s');}
    function settleActionNotice(accepted=false){if(actionNoticeTimer){clearTimeout(actionNoticeTimer);actionNoticeTimer=null;}actionNotice.hidden=true;actionButtons.hidden=true;actionCancel.textContent='Cancel';actionConfirm.hidden=false;actionNotice.removeAttribute('data-tone');actionNotice.removeAttribute('aria-label');actionNotice.setAttribute('role','status');const pending=pendingActionNotice;pendingActionNotice=null;if(pending){if(pending.returnFocus&&pending.returnFocus.isConnected)pending.returnFocus.focus({preventScroll:true});pending.resolve(accepted);}}
    function showActionNotice(message,{tone='status',duration=3200}={}){settleActionNotice(false);actionMessage.textContent=message;actionNotice.dataset.tone=tone;actionNotice.setAttribute('role','status');actionConfirm.hidden=true;actionCancel.textContent='Dismiss';actionButtons.hidden=duration>0;actionNotice.hidden=false;if(duration>0)actionNoticeTimer=setTimeout(()=>settleActionNotice(false),duration);else queueMicrotask(()=>actionCancel.focus({preventScroll:true}));}
    function confirmActionNotice(message,{confirmLabel='Confirm',returnFocus=document.activeElement}={}){settleActionNotice(false);actionMessage.textContent=message;actionNotice.dataset.tone='confirm';actionNotice.setAttribute('role','alertdialog');actionNotice.setAttribute('aria-label','Confirmation');actionCancel.textContent='Cancel';actionConfirm.hidden=false;actionConfirm.textContent=confirmLabel;actionButtons.hidden=false;actionNotice.hidden=false;return new Promise(resolve=>{pendingActionNotice={resolve,returnFocus};queueMicrotask(()=>actionCancel.focus({preventScroll:true}));});}
    async function request(path,options){const response=await fetch(path,options);const result=await response.json();if(!response.ok||result.ok===false)throw new Error(result.error||('Request failed '+response.status));return result;}
    async function refresh(){
      const [working,snapshots,thumbnailResult]=await Promise.all([request('/api/notebook'),request('/api/snapshots'),request('/api/thumbnails')]);
      document.querySelector('#working-status').textContent=counted(working.notebook.noteCount,'note')+' · '+counted(working.notebook.pageCount,'page');
      document.querySelector('#working-summary').textContent='Revision '+working.notebook.revision+' · '+counted(working.notebook.noteCount,'note')+' across '+counted(working.notebook.pageCount,'page')+' · '+when(working.notebook.updatedAt);
      pageList.replaceChildren();
      if(!working.notebook.pages.length){const empty=document.createElement('li');empty.className='empty';empty.textContent='No active pages.';pageList.append(empty);}
      for(const page of working.notebook.pages){
        const item=document.createElement('li');item.className='page-item';
        const copy=document.createElement('div');copy.className='page-copy';const title=document.createElement('strong');title.className='page-title';title.textContent=page.title;const meta=document.createElement('span');meta.className='page-meta';meta.textContent=counted(page.noteCount,'note')+' · next '+String(page.nextNoteNumber).padStart(2,'0');copy.append(title,meta);
        const reset=document.createElement('button');reset.type='button';reset.className='page-reset';reset.textContent='Reset numbering';reset.addEventListener('click',async()=>{const finalNumber=String(page.noteCount).padStart(2,'0');if(!await confirmActionNotice('Reset this page to note numbers 01–'+finalNumber+'? A snapshot preserves the current notation first. Notes, selections and replies stay intact.',{confirmLabel:'Reset numbers',returnFocus:reset}))return;reset.disabled=true;status.textContent='Preserving notebook and resetting notation…';try{const result=await request('/api/pages/reset-numbering',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:page.url})});status.textContent='';await refresh();showActionNotice('Numbering reset to 01–'+finalNumber+'. Snapshot '+String(result.snapshot.number).padStart(2,'0')+' preserved the earlier notation. Refresh captures when you want updated thumbnails.',{duration:5200});}catch(error){status.textContent='';showActionNotice('Could not reset numbering: '+error.message,{tone:'error',duration:0});}finally{reset.disabled=false;}});
        item.append(copy,reset);pageList.append(item);
      }
      document.querySelector('#snapshot-count').textContent=String(snapshots.snapshots.length);
      list.replaceChildren();
      if(!snapshots.snapshots.length){const empty=document.createElement('li');empty.className='empty';empty.textContent='No snapshots yet.';list.append(empty);}
      for(const snapshot of snapshots.snapshots.slice().reverse()){
        const item=document.createElement('li');item.className='snapshot-item';
        const number=document.createElement('span');number.className='snapshot-number';number.textContent=String(snapshot.number).padStart(2,'0');
        const body=document.createElement('div');const title=document.createElement('strong');title.className='snapshot-label';title.textContent=snapshot.label;const meta=document.createElement('span');meta.className='snapshot-meta';meta.textContent=when(snapshot.createdAt)+' · '+counted(snapshot.noteCount,'note')+' · '+counted(snapshot.pageCount,'page');body.append(title,meta);
        const restore=document.createElement('button');restore.type='button';restore.textContent='Restore';restore.addEventListener('click',async()=>{if(!await confirmActionNotice('Restore snapshot '+String(snapshot.number).padStart(2,'0')+' as the working notebook? A safety snapshot preserves the current state first.',{confirmLabel:'Restore',returnFocus:restore}))return;restore.disabled=true;status.textContent='Restoring…';try{await request('/api/snapshots/'+encodeURIComponent(snapshot.id)+'/restore',{method:'POST'});status.textContent='';await refresh();showActionNotice('Snapshot '+String(snapshot.number).padStart(2,'0')+' restored. The previous working state was preserved.');}catch(error){status.textContent='';showActionNotice('Could not restore snapshot: '+error.message,{tone:'error',duration:0});}finally{restore.disabled=false;}});
        item.append(number,body,restore);list.append(item);
      }
      thumbnailList.replaceChildren();
      if(!thumbnailResult.thumbnails.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='No captures yet. Refresh while the annotated pages are available.';thumbnailList.append(empty);}
      for(const thumbnail of thumbnailResult.thumbnails.slice().sort((a,b)=>a.noteNumber-b.noteNumber)){
        const card=document.createElement('article');card.className='thumbnail-card';
        const image=document.createElement('img');image.className='thumbnail-image';image.src=thumbnail.dataUrl;image.alt='Visual receipt for note '+thumbnail.noteNumber;
        const copy=document.createElement('div');copy.className='thumbnail-copy';
        const number=document.createElement('span');number.className='thumbnail-number';number.textContent=String(thumbnail.noteNumber).padStart(2,'0');
        const note=document.createElement('p');note.className='thumbnail-note';note.textContent=thumbnail.note;
        const state=document.createElement('span');state.className='thumbnail-state';state.textContent=thumbnail.sourceRevision===working.notebook.revision?'Current':'Earlier';
        copy.append(number,note,state);card.append(image,copy);thumbnailList.append(card);
      }
    }
    form.addEventListener('submit',async(event)=>{event.preventDefault();status.textContent='Saving snapshot…';try{const result=await request('/api/snapshots',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label:label.value})});label.value='';status.textContent='';await refresh();showActionNotice('Snapshot '+String(result.snapshot.number).padStart(2,'0')+' saved.');}catch(error){status.textContent='';showActionNotice('Could not save snapshot: '+error.message,{tone:'error',duration:0});}});
    thumbnailButton.addEventListener('click',async()=>{thumbnailButton.disabled=true;thumbnailStatus.textContent='Capturing each note…';try{const result=await request('/api/thumbnails/refresh',{method:'POST'});thumbnailStatus.textContent='';await refresh();showActionNotice(result.output||'Thumbnails refreshed.');}catch(error){thumbnailStatus.textContent='';showActionNotice('Could not refresh captures: '+error.message,{tone:'error',duration:0});}finally{thumbnailButton.disabled=false;}});
    document.querySelector('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(${JSON.stringify(bookmarklet)});showActionNotice('Loader copied.');}catch(error){showActionNotice('Could not copy loader: '+error.message,{tone:'error',duration:0});}});
    actionCancel.addEventListener('click',()=>settleActionNotice(false));
    actionConfirm.addEventListener('click',()=>settleActionNotice(true));
    addEventListener('keydown',event=>{if(event.key==='Escape'&&pendingActionNotice){event.preventDefault();settleActionNotice(false);}});
    refresh().catch(error=>{showActionNotice('Could not open notebook: '+error.message,{tone:'error',duration:0});});
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
          pages: pageSummaries(notes, notebook),
        },
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/snapshots') {
      const snapshots = await readSnapshots();
      json(response, 200, { snapshots: snapshots.map(snapshotSummary) });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/thumbnails') {
      const thumbnails = await readThumbnails();
      json(response, 200, { thumbnails });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/thumbnails') {
      const input = await readBody(request);
      if (!validThumbnail(input)) {
        json(response, 422, { ok: false, error: 'invalid_thumbnail' });
        return;
      }
      const notes = await readNotes();
      const note = notes.find((item) => item.id === input.noteId);
      if (!note) {
        json(response, 404, { ok: false, error: 'note_not_found' });
        return;
      }
      const thumbnails = await readThumbnails();
      const notebook = await readNotebook(notes);
      const thumbnail = {
        id: thumbnails.find((item) => item.noteId === note.id)?.id || randomUUID(),
        noteId: note.id,
        noteNumber: note.number,
        note: note.note,
        url: note.url,
        title: note.title || '',
        selectionCount: selectionsFromInput(note).length,
        capturedAt: new Date().toISOString(),
        sourceRevision: notebook.revision,
        viewport: input.viewport || null,
        width: input.width,
        height: input.height,
        dataUrl: input.dataUrl,
      };
      const index = thumbnails.findIndex((item) => item.noteId === note.id);
      if (index === -1) thumbnails.push(thumbnail);
      else thumbnails[index] = thumbnail;
      await writeThumbnails(thumbnails);
      json(response, 200, { ok: true, thumbnail });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/thumbnails/refresh') {
      const output = await refreshThumbnails();
      json(response, 200, { ok: true, output, thumbnails: await readThumbnails() });
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
      await writeThumbnails(structuredClone(snapshot.thumbnails || []));
      const restoredPageSequences = pageSequencesFor(
        restoredNotes,
        snapshot.notebookState?.pageSequences,
      );
      const notebook = await saveWorkingMutation(restoredNotes, {
        ...currentNotebook,
        nextNoteNumber: Number.isInteger(snapshot.notebookState?.nextNoteNumber)
          ? snapshot.notebookState.nextNoteNumber
          : Math.max(0, ...restoredNotes.map((note) => Number(note.number) || 0)) + 1,
        pageSequences: restoredPageSequences,
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
      const selections = structuredClone(selectionsFromInput(input));
      const number = notebook.pageSequences?.[input.url] || 1;
      const note = {
        id: randomUUID(),
        number,
        createdAt: new Date().toISOString(),
        status: 'open',
        replies: [],
        ...input,
        note: input.note.trim(),
        selection: selections[0],
        selections,
      };
      notes.push(note);
      const nextNotebook = await saveWorkingMutation(notes, {
        ...notebook,
        nextNoteNumber: Math.max(notebook.nextNoteNumber, number + 1),
        pageSequences: { ...notebook.pageSequences, [input.url]: number + 1 },
      });
      json(response, 201, { ok: true, note, revision: nextNotebook.revision });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/pages/reset-numbering') {
      const input = await readBody(request);
      const pageUrl = typeof input?.url === 'string' ? input.url : '';
      if (!pageUrl || pageUrl.length > 4_096) {
        json(response, 422, { ok: false, error: 'page_url_required' });
        return;
      }
      const notes = await readNotes();
      const pageNotes = notes
        .filter((note) => note.url === pageUrl)
        .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0)
          || String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
      if (!pageNotes.length) {
        json(response, 404, { ok: false, error: 'page_notes_not_found' });
        return;
      }
      const pageTitle = pageNotes.at(-1)?.title || pageUrl;
      const snapshot = await createSnapshot({
        label: `Before numbering reset: ${pageTitle}`,
        reason: 'before-numbering-reset',
      });
      const numbers = new Map(pageNotes.map((note, index) => [note.id, index + 1]));
      const resetAt = new Date().toISOString();
      const renumbered = notes.map((note) => numbers.has(note.id)
        ? { ...note, number: numbers.get(note.id), renumberedAt: resetAt }
        : note);
      const notebook = await readNotebook(notes);
      const nextNumber = pageNotes.length + 1;
      const nextNotebook = await saveWorkingMutation(renumbered, {
        ...notebook,
        pageSequences: { ...notebook.pageSequences, [pageUrl]: nextNumber },
      });
      const pageIds = new Set(pageNotes.map((note) => note.id));
      const thumbnails = await readThumbnails();
      await writeThumbnails(thumbnails.filter((thumbnail) => !pageIds.has(thumbnail.noteId)));
      json(response, 200, {
        ok: true,
        pageUrl,
        noteCount: pageNotes.length,
        nextNoteNumber: nextNumber,
        snapshot: snapshotSummary(snapshot),
        revision: nextNotebook.revision,
      });
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
      await removeOrphanedThumbnails(kept);
      json(response, 200, { ok: true, deletedCount, pageUrl, permanent: true, revision: notebook.revision });
      return;
    }

    const replyMatch = url.pathname.match(/^\/api\/notes\/([^/]+)\/replies$/);
    if (request.method === 'POST' && replyMatch) {
      const input = await readBody(request);
      const text = typeof input?.text === 'string' ? input.text.trim() : '';
      const author = ['notie', 'beab'].includes(input?.author) ? 'notie' : 'human';
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
      const hasText = typeof input?.note === 'string';
      const hasSelections = Array.isArray(input?.selections);
      if ((!hasText && !hasSelections)
        || (hasText && (input.note.trim().length === 0 || input.note.length > 20_000))
        || (hasSelections && (input.selections.length === 0 || input.selections.length > 32 || !input.selections.every(validSelection)))) {
        json(response, 422, { ok: false, error: 'invalid_note_update' });
        return;
      }
      const notes = await readNotes();
      const index = notes.findIndex((note) => note.id === decodeURIComponent(noteMatch[1]));
      if (index === -1) {
        json(response, 404, { ok: false, error: 'note_not_found' });
        return;
      }
      const selections = hasSelections ? structuredClone(input.selections) : selectionsFromInput(notes[index]);
      notes[index] = {
        ...notes[index],
        note: hasText ? input.note.trim() : notes[index].note,
        selection: selections[0],
        selections,
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
      await removeOrphanedThumbnails(notes);
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
