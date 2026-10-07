# DevNotes Beta 2, visual receipts and Notie

Date: 6 October 2026

## Objective

Turn the successful annotation overlay into a durable working notebook without
losing the speed of the Beta 1 loop.

The working principle was that a note should remain the source of truth. New
surfaces such as snapshots and thumbnails should preserve, navigate or depict
that note rather than replace it.

## Versioned notebook

Beta 2 introduced:

- an autosaved working notebook;
- notebook revisions and stable note IDs;
- immutable named snapshots;
- snapshot summaries with source revision, note count and page count;
- a restore path that first creates a `before-restore` safety snapshot;
- preservation of notes, replies, preferences and later thumbnail receipts.

The DevNotes home became a small dashboard for working state and deliberate
boundaries. Restoring a snapshot creates a new working revision. It never edits
the old snapshot.

## Reply interaction

The note card adopted the useful Sketchiebook rhythm while retaining DevNotes'
own geometry and browser context:

- direct textareas rather than separate view and edit modes;
- quiet actions with Keep as the primary control;
- chronological replies inside the same note;
- note edits must be kept before a reply can be sent;
- the card remains draggable and resizable.

The resident DevNotes agent was named **Notie**, analogous to Sketchie in
Sketchiebook. Human replies display as **You**. Agent replies display as
**Notie**.

Legacy records with `author: "beab"` remain untouched but render as Notie. New
agent replies use `author: "notie"`. The visual treatment reads as marginal
correspondence rather than chat bubbles: compact speaker and time metadata, a
technical face for human replies, and a quieter serif voice for Notie.

## Grouped selections

A note can now own up to 32 selections. This came directly from live landing
page review, where one thought could refer to a highlighted object and an arrow
showing where it should move.

The note inspector supports:

- Add selection and guarded Remove selection;
- an independent colour for each selection;
- compatible in-place tool changes;
- one Keep action for the whole grouped note;
- opening a specific member of a grouped note through its marker.

Text remains text and polygons remain polygons. Two-point geometry can change
between rectangle, ellipse, highlight, line, arrow and double-arrow.

## Responsive geometry

The first responsive rule attached an entire annotation to one broad element.
That was insufficient for arrows whose endpoints referred to different parts
of a page.

The revised model stores an anchor for each geometry point. Candidate elements
are ranked by proximity and useful specificity, with exact normalized text used
to disambiguate repeated selectors. One arrow endpoint can follow navigation
while the other follows a headline through reflow.

Existing notes without stored point anchors derive them at render time and
persist them only when the note is deliberately kept. Text selections continue
to use exact DOM ranges first, then quote and surrounding-context recovery.

The existing headline highlight and navigation-to-headline arrow were visually
verified at 1440 by 900 and 760 by 900 viewports.

## Running visual receipts

The dashboard now holds a derived thumbnail ledger:

- Refresh captures opens each recorded page in a private Chromium worker.
- It isolates one note at a time and captures the current live viewport.
- Each receipt records note identity, URL, viewport, selection count, capture
  time and working revision.
- Receipts display as Current or Earlier relative to the notebook revision.
- Named snapshots preserve the thumbnail ledger.
- Deleting a note removes its current derived receipt.

The first live run captured all five active notes. The notes themselves were not
edited or deleted during verification.

## Safe notation reset

Visible note numbers are page-scoped. Deletion may leave honest gaps during a
working pass. The dashboard provides an explicit **Reset numbering** action for
the moment Krystian wants to compact them.

Reset numbering:

1. Creates an immutable `before-numbering-reset` snapshot.
2. Renumbers only the selected page to `01, 02, 03...`.
3. Preserves stable IDs, selections, replies and other pages.
4. Sets the next note to the following page-scoped number.
5. Removes current thumbnails whose pixels show the old labels.
6. Leaves the earlier thumbnails inside the safety snapshot.

The control was added to the live dashboard but deliberately not activated on
the five current notes during implementation.

## Action confirmation and status

Delete, Clear, Restore and Reset numbering now use one DevNotes-native notice
instead of browser `confirm()` and `alert()` interruptions. The notice names the
exact scope, gives Cancel initial focus, supports Escape, returns focus to the
trigger and reports success or failure without shifting the working layout.

## Verified Git chronology

| Commit | Time | Verified change |
| --- | --- | --- |
| `13df9e5` | 14:12 | Add versioned notebooks and note replies |
| `f37b9d3` | 14:52 | Add grouped selections and visual receipts |
| `742bdd7` | 15:00 | Style replies and name the agent Notie |
| `ad5ac90` | 15:10 | Add safe page numbering reset |

Times are Toronto local time on 6 October 2026.

## Current boundaries

- One working notebook. No multi-notebook switcher yet.
- No browser extension, source-map integration or formal MCP server yet.
- Replies cannot yet be edited or individually deleted.
- Responsive anchoring is a bounded semantic rule, not a complete layout
  understanding system.
- Thumbnail capture requires the annotated page and Chromium to be available.
