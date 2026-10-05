# Live interface annotation Beta 1

A separate, local-only instrument for attaching visual notes to a live web
page. A person marks the experienced shape; the tool records the browser and
DOM context needed for a coding agent to inspect the same thing.

It does not belong to Sketchiebook and does not modify the annotated page's
source repository.

## Beta 1

Beta 1 proves the complete local loop:

1. Attach the annotation layer to a local page without changing that page.
2. Draw a visual selection and write a note.
3. Preserve the selection, note, route, viewport, scroll position and nearby
   DOM evidence in a private local ledger.
4. Let a coding agent read the same record and inspect the target mechanically.

The first real annotation completed that loop. See
[`docs/BETA-1.md`](docs/BETA-1.md) for the accepted boundary and limitations.

## Run

```sh
npm run dev
```

The loopback service listens on `http://127.0.0.1:4347`. Open that address and
drag its loader bookmarklet into Chrome's bookmarks bar. The bookmark attaches
the overlay to the current local page without modifying that page's source.
The overlay records notes in `.data/notes.json`.

The annotation ledger is intentionally ignored by Git. `.data/.gitkeep`
preserves the directory without publishing private note content.

## Tools

- Polygonal lasso: click to place corners, then click the first point or press
  Return to close the selection.
- Rectangle, ellipse, line, arrow and text-highlight tools use direct dragging.
- Each annotation stores its own colour, including black and white.
- The controls and note editor adapt to narrow viewports and mobile safe areas.
- Element-backed annotations can follow their captured element across a layout
  change. Pure whitespace selections remain viewport-specific.
- Every note stores its exact shape, URL, title, viewport, scroll position and
  nearby DOM evidence.
- Notes remain private and local.

## Beta 1 limitations

- No browser extension, screenshots, replies, source maps, or formal MCP server
  yet.
- The bookmarklet works on local HTTP pages while the loopback service is
  running.
- Element re-anchoring is a bounded first rule, not a complete semantic layout
  mapping system.

## Verify

```sh
npm run check
curl http://127.0.0.1:4347/health
```
