# DevNotes Beta 3

Date: 8 October 2026
Status: additive frozen-canvas proof

## Purpose

Test the accepted frozen-layered-snapshot medium without replacing DevNotes
Beta 2 or changing an annotated project's source.

Beta 3 is loaded through its own script. The existing DevNotes annotation
loader, notebook, notes, replies, snapshots, thumbnails and Notie interaction
remain intact.

## Use

1. Start DevNotes normally.
2. Open the DevNotes home at `http://127.0.0.1:4347/`.
3. Use **Load Beta 3** on the live page, or copy the separate Beta 3 loader.
4. Exit Beta 3 to return to the ordinary DevNotes overlay when it was already
   present.

The Beta 3 loader freezes the current rendered viewport immediately.

## Implemented proof

Beta 3 currently provides:

- a separate frozen-page overlay;
- a script-free `srcdoc` clone of the current rendered page;
- paused CSS animation and transition behaviour;
- meaningful visible-element discovery;
- source identity labels for captured layers;
- hover discovery and click selection;
- Parent traversal for nested layers;
- direct movement of a layer by dragging the object or its blue label;
- east, south and southeast resize handles;
- simple text-layer copy editing;
- one operation per completed move, resize or copy edit;
- Undo and Redo;
- immutable Original and editable Experiment views;
- per-layer revert;
- complete experiment Reset;
- Exit without changing the live page;
- restoration of the Beta 2 overlay when it was visible before Beta 3.

The top bar and inspector remain separate from the captured page. The frozen
page is the primary working surface.

## Layer boundary

All rendered elements with measurable visible bounds are indexed in the proof.
Nested structures remain nested. For example, the portfolio headline is one
parent layer containing seven editable text spans.

Clicking a phrase selects the phrase. **Parent** selects the full headline.
The selected parent can then be moved through its blue layer label and resized
through the handles. This preserves the real depth of the rendered page instead
of flattening it into one artificial object.

## Reversibility

The frozen original is stored separately from the operation history.

- Original replays zero operations.
- Experiment replays every applied operation through the history cursor.
- Undo and Redo move the cursor.
- Revert layer removes operations for the selected layer only.
- Reset clears the entire experiment.
- Exit removes the Beta 3 overlay.

The underlying live document is never used as the editable state.

## Verification

Run:

```sh
npm run verify:beta3
```

The verifier uses an explicitly identified Chromium executable and the live
portfolio at `http://127.0.0.1:4331/`. It:

1. stores the live `<main>` source;
2. loads Beta 3;
3. freezes the rendered page;
4. selects a headline phrase and then its parent heading;
5. moves the heading;
6. widens it;
7. edits a captured text phrase;
8. verifies three semantic history operations;
9. checks Original geometry and copy;
10. returns to Experiment;
11. resets and exits;
12. compares the live `<main>` before and after.

Verified result on 8 October 2026:

```json
{
  "layers": 26,
  "operations": [
    "move-layer",
    "resize-layer",
    "edit-copy"
  ],
  "sourceUnchanged": true,
  "errors": []
}
```

The existing API and notebook test suite also remains green.

## Deliberate limitations

This proof does not yet implement:

- saved or named ideas;
- persistence across page reloads;
- accepted-target freezing;
- multi-viewport ideas;
- visual receipts for experimental frames;
- arbitrary layer grouping;
- proportional group scaling;
- alignment guides or spacing measurements;
- a layer-tree panel;
- pseudo-element editing;
- raster fallbacks for Canvas, WebGL, video or cross-origin embeds;
- implementation handoff bundles;
- Binareyes masks or verification;
- source-code generation or mutation.

Text editing is intentionally limited to simple captured text layers. Composite
copy can be edited through its child text layers without destroying the parent
structure.

## Boundary

Beta 2 remains the stable annotation notebook. Beta 3 is an additive local
proof of direct manipulation in a frozen layered overlay.

The broader accepted architecture remains in
[`architecture/FROZEN_LAYERED_SNAPSHOT.md`](architecture/FROZEN_LAYERED_SNAPSHOT.md).
