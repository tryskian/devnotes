# DevNotes Beta 2 record

Date: 6 October 2026

## Purpose

Turn the Beta 1 annotation loop into a versioned working notebook while
adapting Sketchiebook's proven note-card interaction without redesigning the
DevNotes shell or removing its native browser evidence.

## Working notebook

- Notes, replies, edits, deletions and preferences autosave immediately.
- `notebook.json` records schema version, working revision, page-scoped note
  sequences, snapshot numbering and last-change time.
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
- styled correspondence with You and Notie author labels;
- note edits must be kept before a reply can be sent.

DevNotes retains its native selected quotation, geometry type, colours, live
text ranges, DOM anchors, draggable and resizable panels, responsive toolbar,
per-page clearing and exact browser context.

Boundary actions share one DevNotes-native confirmation and status notice.
Delete, Clear, Restore and Reset numbering name the exact scope and consequence;
Cancel receives initial focus, Escape cancels, and focus returns to the action
that opened the notice. Success notices dismiss after a short interval while
errors remain visible.

## Grouped and responsive selections

- A note can hold up to 32 independent selections.
- Add selection temporarily returns to the live page, then reopens the same
  note with the new selection still unsaved until Keep.
- Remove selection cannot remove the final selection from a note.
- Geometry tools with the same two-point shape can be changed in place.
  Text and polygon selections keep their structurally compatible tool.
- Every geometry point is anchored independently to the smallest nearby DOM
  element with matching text. An arrow can therefore keep one endpoint near
  navigation while its other endpoint follows a headline through reflow.
- Legacy single-selection notes remain readable and migrate only when kept.

## Running thumbnails

- The DevNotes home can refresh a visual receipt for every note in the working
  notebook.
- A private Chromium worker opens each recorded URL, isolates one note and
  captures the live viewport without altering the target repository.
- Each receipt records the note number, note ID, URL, capture time, viewport,
  selection count and working revision.
- Receipts are derived evidence. A receipt from an earlier working revision is
  marked Earlier until refreshed.
- Named snapshots include the thumbnail ledger, and restore recovers the visual
  receipts alongside notes and preferences.

## Notation reset

- Every active page has an independent visible note sequence.
- The working-notebook dashboard shows each page's note count and next number.
- Reset numbering creates an immutable `before-numbering-reset` snapshot, then
  compacts the page's active notes into `01, 02, 03…`.
- Stable note IDs, selections, replies and other pages remain unchanged.
- Current thumbnails for that page are discarded because their pixels contain
  the previous labels. The preserved snapshot retains them, and Refresh
  captures creates receipts with the new notation.

## Private data boundary

All working and snapshot state remains under `.data/` and is excluded from Git.
The pre-Beta-2 copies of the live notes and preferences remain private beside
the migrated files.

## Deliberate limitations

- One working notebook in Beta 2; a multi-notebook switcher is future work.
- Snapshots are local and immutable, with no diff or merge surface yet.
- Replies can be created but not edited or individually deleted yet.
- No browser extension, source maps or formal MCP server.
- Capture refresh requires its target pages to be running and available.
