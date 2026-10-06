# DevNotes

**DevTools, but for noties.**

DevNotes is a local instrument for attaching visual notes to a live web page.
A person marks the experienced shape; DevNotes records the browser and DOM
context needed for a coding agent to inspect the same thing.

It does not belong to Sketchiebook and does not modify the annotated page's
source repository.

## DevNotes Beta 2

Beta 2 turns the successful annotation loop into a working notebook:

1. The working notebook autosaves every note, reply, edit and deletion.
2. Named snapshots preserve immutable copies of notes, replies, preferences,
   pages and revision context.
3. Restoring a snapshot first preserves the current working notebook as a
   safety snapshot, then creates a new working state from the selected version.
4. Note cards adopt Sketchiebook's direct textarea, quiet actions, Keep
   control and chronological reply thread while retaining DevNotes geometry,
   live text, colour, DOM evidence, dragging and responsiveness.
5. One note can hold several selections, and its selection controls can change
   a compatible tool or colour without replacing the note.
6. A local Chromium capture worker keeps a thumbnail ledger of the current
   notebook. Notebook snapshots preserve those visual receipts too.

See [`docs/BETA-2.md`](docs/BETA-2.md) for the current boundary. The original
annotation-loop record remains in [`docs/BETA-1.md`](docs/BETA-1.md).

## Run

```sh
npm run dev
```

The loopback service listens on `http://127.0.0.1:4347`. Open that address and
drag its loader bookmarklet into Chromium's bookmarks bar. The bookmark attaches
the overlay to the current local page without modifying that page's source.
The overlay records the autosaved working notebook in `.data/notes.json`.
Notebook revision metadata, preferences and snapshots remain beside it in
`.data/notebook.json`, `.data/preferences.json` and `.data/snapshots.json`.
Derived visual receipts live in `.data/thumbnails.json`.

The annotation ledger is intentionally ignored by Git. `.data/.gitkeep`
preserves the directory without publishing private note content.

## Tools

- Polygonal lasso: click to place corners, then click the first point or press
  Return to close the selection.
- Rectangle, ellipse, line, single-arrow, double-arrow and area-highlight tools
  use direct dragging.
- Text uses the browser's native live selection and stores the exact quotation,
  DOM range anchors, surrounding quote context and per-line rectangles.
- Each annotation stores its own colour, including black and white.
- The selected tool and colour persist through the private loopback service.
- Annotation mode stays active across successive notes. Selecting a tool arms
  it immediately; Start resumes the selected tool; Done or Escape returns the
  page to normal interaction.
- The controls and note editor adapt to narrow viewports and mobile safe areas.
- Each geometry point keeps its own element anchor, so rectangles, arrows and
  lines can follow different parts of a changing layout. Pure whitespace
  endpoints remain viewport-specific.
- Text annotations re-resolve their exact DOM range first, then fall back to
  quote and surrounding-context matching when the page structure changes.
- Every note stores its exact shape, URL, title, viewport, scroll position and
  nearby DOM evidence.
- Clicking a numbered marker opens its note. Deleting from that inspector
  permanently removes the confirmed note from the local ledger.
- A note can collect up to 32 selections. Add selection returns to the live
  page, then brings the same note card back for review and one Keep action.
- Compatible geometry can be changed in place, including line, arrow,
  double-arrow, rectangle, ellipse and highlight. Every selection keeps an
  independent colour.
- Note text can be edited without replacing its shape, colour, browser context
  or creation identity.
- Saved notes contain a chronological reply thread. Human replies are labelled
  You; agent-authored replies are labelled Notie. Legacy Beab replies remain
  readable as Notie without rewriting the private notebook.
- Draft and saved note cards use the Sketchiebook working rhythm: a direct
  textarea, quiet actions, and Keep as the primary control.
- The new-note editor and saved-note inspector can be dragged by their header so
  they do not cover the page being discussed. Double-clicking the header resets
  the panel position.
- Clear page notes permanently removes only the notes attached to the current
  page URL after confirming the exact count.
- The DevNotes home shows the autosaved working notebook, creates named
  immutable snapshots and restores a snapshot only after creating a safety
  copy of the current state.
- Refresh captures runs a private headless Chromium pass over every note URL,
  isolates one note at a time and records a current thumbnail. Captures that
  predate the latest working revision are visibly marked Earlier.
- Notes remain private and local.

## Beta 2 limitations

- No browser extension, source maps, multi-notebook switcher or formal MCP
  server yet.
- The bookmarklet works on local HTTP pages while the loopback service is
  running.
- Element re-anchoring is a bounded first rule, not a complete semantic layout
  mapping system.
- Thumbnail refresh requires every annotated URL to be available and an actual
  Chromium executable. Set `DEVNOTES_CHROMIUM_EXECUTABLE` when the local Codex
  Chromium helper is unavailable.

## Verify

```sh
npm run check
npm test
npm run thumbnails
curl http://127.0.0.1:4347/health
```
