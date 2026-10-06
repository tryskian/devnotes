# DevNotes Beta 2 record

Date: 6 October 2026

## Purpose

Turn the Beta 1 annotation loop into a versioned working notebook while
adapting Sketchiebook's proven note-card interaction without redesigning the
DevNotes shell or removing its native browser evidence.

## Working notebook

- Notes, replies, edits, deletions and preferences autosave immediately.
- `notebook.json` records schema version, working revision, note numbering,
  snapshot numbering and last-change time.
- Existing Beta 1 notes migrate in place without changing their IDs, geometry,
  colour, URL, DOM evidence or text anchors.

## Snapshots

- A named snapshot is an immutable copy of the full working notes and
  preferences at one revision.
- Snapshot summaries record number, label, timestamp, reason, source revision,
  note count and page count.
- Restoring never edits an old snapshot. DevNotes first creates a `before-restore`
  safety snapshot of the current working notebook, then copies the selected
  snapshot into a new working revision.
- The DevNotes home owns snapshot creation, history and restore controls. The
  annotated target URL remains unchanged.

## Note-card adaptation

The card follows Sketchiebook's working UX:

- `A little note` for drafts and `Note N · X replies` for saved notes;
- direct textarea instead of a separate display/edit mode;
- quiet Delete and primary Keep actions;
- chronological nested replies inside the same card;
- reply composer with You and Beab author labels;
- note edits must be kept before a reply can be sent.

DevNotes retains its native selected quotation, geometry type, colours, live
text ranges, DOM anchors, draggable and resizable panels, responsive toolbar,
per-page clearing and exact browser context.

## Private data boundary

All working and snapshot state remains under `.data/` and is excluded from Git.
The pre-Beta-2 copies of the live notes and preferences remain private beside
the migrated files.

## Deliberate limitations

- One working notebook in Beta 2; a multi-notebook switcher is future work.
- Snapshots are local and immutable, with no diff or merge surface yet.
- Replies can be created but not edited or individually deleted yet.
- No browser extension, screenshot capture, source maps or formal MCP server.
