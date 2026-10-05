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
const port = Number.parseInt(process.env.ANNOTATION_PORT || '4347', 10);
const host = '127.0.0.1';

await mkdir(dataDirectory, { recursive: true });

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
  return input
    && typeof input.url === 'string'
    && input.url.length <= 4_096
    && typeof input.note === 'string'
    && input.note.trim().length > 0
    && input.note.length <= 20_000
    && Array.isArray(input.selection?.points)
    && ['polygon', 'lasso', 'rectangle', 'ellipse', 'line', 'arrow', 'double-arrow', 'highlight'].includes(type)
    && input.selection.points.length >= minimumPoints
    && /^#[0-9a-f]{6}$/i.test(input.selection?.color || '#111111');
}

const bookmarklet = "javascript:(()=>{const old=document.getElementById('live-interface-annotation-loader');if(old)old.remove();const s=document.createElement('script');s.id='live-interface-annotation-loader';s.src='http://127.0.0.1:4347/client.js';document.documentElement.append(s)})()";

function loaderPage(noteCount) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Live interface annotation prototype</title>
  <style>
    :root{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#050505;background:#fefefe}
    *{box-sizing:border-box}body{margin:0;min-height:100svh;padding:clamp(1.25rem,5vw,4rem);display:grid;align-content:space-between;gap:4rem}
    header,main,footer{width:min(58rem,100%)}header{display:flex;justify-content:space-between;gap:1rem;padding-bottom:1rem;border-bottom:1px solid}
    .label{text-transform:uppercase;letter-spacing:.08em}h1{max-width:14ch;margin:0 0 1.5rem;font:500 clamp(2.5rem,8vw,6rem)/.96 Georgia,serif}
    p,li{max-width:66ch;font-size:clamp(.95rem,1.5vw,1.1rem);line-height:1.65}ol{padding-left:1.4rem}.actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}
    a,button{border:1px solid #050505;border-radius:0;padding:.8rem 1rem;background:#fefefe;color:#050505;font:600 .78rem/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-decoration:none;text-transform:uppercase;letter-spacing:.06em;cursor:pointer}
    a:hover,button:hover{background:#050505;color:#fefefe}code{font:inherit;background:#eee;padding:.1em .25em}footer{padding-top:1rem;border-top:1px solid;font-size:.75rem;color:#555}
  </style>
</head>
<body>
  <header><span class="label">Local annotation tool</span><span>${noteCount} saved note${noteCount === 1 ? '' : 's'}</span></header>
  <main>
    <h1>Draw on the live page.</h1>
    <p>This page runs the private loopback service. To attach the annotation layer yourself, drag the loader below into Chrome's bookmarks bar once.</p>
    <ol>
      <li>Drag <strong>Load annotation tool</strong> to the bookmarks bar.</li>
      <li>Open a local page such as <code>127.0.0.1:4331</code>.</li>
      <li>Click the bookmark whenever you want the annotation layer.</li>
    </ol>
    <div class="actions">
      <a href="${bookmarklet}">Load annotation tool</a>
      <button type="button" id="copy">Copy loader</button>
      <a href="http://127.0.0.1:4331/">Open local portfolio</a>
    </div>
  </main>
  <footer>Private loopback service · 127.0.0.1:4347</footer>
  <script>document.querySelector('#copy').addEventListener('click',async(event)=>{await navigator.clipboard.writeText(${JSON.stringify(bookmarklet)});event.currentTarget.textContent='Copied';});</script>
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
      json(response, 200, { ok: true, service: 'live-interface-annotation-prototype' });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/') {
      const notes = await readNotes();
      response.writeHead(200, {
        ...headers,
        'Content-Type': 'text/html; charset=utf-8',
      });
      response.end(loaderPage(notes.length));
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
      const note = {
        id: randomUUID(),
        number: notes.length + 1,
        createdAt: new Date().toISOString(),
        status: 'open',
        ...input,
        note: input.note.trim(),
      };
      notes.push(note);
      await writeNotes(notes);
      json(response, 201, { ok: true, note });
      return;
    }

    const noteMatch = url.pathname.match(/^\/api\/notes\/([^/]+)$/);
    if (request.method === 'DELETE' && noteMatch) {
      const notes = await readNotes();
      const index = notes.findIndex((note) => note.id === decodeURIComponent(noteMatch[1]));
      if (index === -1) {
        json(response, 404, { ok: false, error: 'note_not_found' });
        return;
      }
      const [note] = notes.splice(index, 1);
      await writeNotes(notes);
      json(response, 200, { ok: true, note, permanent: true });
      return;
    }

    json(response, 404, { ok: false, error: 'not_found' });
  } catch (error) {
    const status = error?.message === 'body_too_large' ? 413 : 500;
    json(response, status, { ok: false, error: error?.message || 'unknown_error' });
  }
});

server.listen(port, host, () => {
  console.log(`Annotation prototype listening on http://${host}:${port}`);
});
