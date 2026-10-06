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

See [`docs/BETA-2.md`](docs/BETA-2.md) for the current boundary. The original
annotation-loop record remains in [`docs/BETA-1.md`](docs/BETA-1.md).

## Run

```sh
npm run dev
```

The loopback service listens on `http://127.0.0.1:4347`. Open that address and
drag its loader bookmarklet into Chrome's bookmarks bar. The bookmark attaches
the overlay to the current local page without modifying that page's source.
The overlay records the autosaved working notebook in `.data/notes.json`.
Notebook revision metadata, preferences and snapshots remain beside it in
`.data/notebook.json`, `.data/preferences.json` and `.data/snapshots.json`.

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
- Element-backed annotations can follow their captured element across a layout
  change. Pure whitespace selections remain viewport-specific.
- Text annotations re-resolve their exact DOM range first, then fall back to
  quote and surrounding-context matching when the page structure changes.
- Every note stores its exact shape, URL, title, viewport, scroll position and
  nearby DOM evidence.
- Clicking a numbered marker opens its note. Deleting from that inspector
  permanently removes the confirmed note from the local ledger.
- Note text can be edited without replacing its shape, colour, browser context
  or creation identity.
- Saved notes contain a chronological reply thread. Human replies are labelled
  You; agent-authored replies can be labelled Beab through the local API.
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
- Notes remain private and local.

## Beta 2 limitations

- No browser extension, screenshots, source maps, multi-notebook switcher or
  formal MCP server yet.
- The bookmarklet works on local HTTP pages while the loopback service is
  running.
- Element re-anchoring is a bounded first rule, not a complete semantic layout
  mapping system.

## Verify

```sh
npm run check
curl http://127.0.0.1:4347/health
```
