# Beta 1 record

Date: 5 October 2026

## Purpose

Create a local collaborative annotation layer for live interfaces. The human
selects the visual shape they are experiencing and writes the meaning directly
on it. The coding agent receives that note with enough browser evidence to
inspect the same target without requiring the human to translate it into
developer terminology.

This is a separate instrument. It is not part of Sketchiebook and does not
write into the annotated website repository.

## Accepted Beta 1 loop

1. Run the loopback service on `127.0.0.1:4347`.
2. Attach the client to a local page through the loader bookmarklet.
3. Draw a polygon or geometric annotation, or drag a text highlight.
4. Choose a colour and write a note.
5. Save the note into the private local ledger.
6. Read the same note through the loopback API with its URL, viewport, scroll,
   geometry and nearby DOM elements.

## Verified evidence

- The server and client pass JavaScript syntax checks.
- The loader page exposes a stable bookmarklet and reports the saved-note count.
- The first user-created polygonal note was saved and read back through the
  loopback API with its page and DOM context.
- The annotation controls fit in a single row at a 390 by 844 CSS-pixel mobile
  viewport and respect safe-area insets.
- An element-backed annotation repositions against its captured element when
  the layout changes.
- The visible overlay can be removed without deleting the saved note ledger.

## Current tools

- Polygon
- Rectangle
- Ellipse
- Line
- Arrow
- Double arrow
- Highlight
- Per-annotation colour
- Show or hide annotations
- Click a numbered marker to inspect its note
- Edit note text while preserving annotation geometry and context
- Confirmed permanent note deletion
- Confirmed page-scoped note clearing
- Responsive note editor and control bar
- Draggable new-note and saved-note panels with viewport clamping

## Deliberate limitations

- Local pages only in Beta 1.
- No browser extension or automatic persistent injection.
- No image capture, reply threads, source maps, formal MCP server or resolved
  state interface yet.
- Whitespace-only selections remain tied to their original viewport because
  they do not have an honest DOM anchor.
- Element re-anchoring is proportional and may require a richer text or layout
  anchor in a later beta.

## Private data boundary

`.data/notes.json` contains user annotation content and is excluded from Git.
Only `.data/.gitkeep` is versioned.
