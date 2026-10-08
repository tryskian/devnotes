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
- authored text-block grouping so inline word and phrase spans do not become
  separate canvas objects;
- hover discovery and click selection;
- Parent traversal for nested layers;
- direct movement of a layer by dragging the object or its blue label;
- magenta alignment guides and snapping for layer edges, centres, viewport
  edges and viewport centre;
- east, south and southeast resize handles;
- simple text-layer copy editing;
- whole-block copy editing with immutable original markup;
- text formatting controls for size, line height, letter spacing, alignment,
  case transform, weight, italic, underline and strike-through;
- inline range formatting so Bold, Italic, Underline and Strike can apply to a
  selected word or phrase without turning words into canvas layers;
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

Rendered elements with measurable visible bounds are indexed in the proof.
Authored text blocks remain whole layers. Inline spans used to control word or
phrase layout remain inside their text block and do not clutter the canvas as
individual objects.

For example, the portfolio headline is one `h1` layer even though its live
markup contains seven spans. Selecting any word resolves to the full headline.
The original nested markup remains immutable; copy edits and formatting belong
only to the experiment.

Entering text editing keeps the block selected as one canvas object. Selecting
a word or phrase inside that block changes the scope of Bold, Italic, Underline
and Strike to the native text range. With no active range, those controls format
the complete text block.

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
4. selects the authored headline as one text layer;
5. moves the heading;
6. verifies a visible alignment guide and snap;
7. widens it;
8. changes font size and case transform;
9. enters text editing, selects the word `research` and bolds only that range;
10. edits the captured headline copy as one text block;
11. verifies movement, resize, block-format, inline-format and copy-edit
    operations;
12. checks Original geometry, formatting, nested markup and copy;
13. returns to Experiment;
14. resets and exits;
15. compares the live `<main>` before and after.

Verified result on 8 October 2026:

```json
{
  "layers": 15,
  "operations": [
    "move-layer",
    "resize-layer",
    "format-text",
    "format-inline-text",
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
- spacing measurements;
- a layer-tree panel;
- pseudo-element editing;
- raster fallbacks for Canvas, WebGL, video or cross-origin embeds;
- implementation handoff bundles;
- Binareyes masks or verification;
- source-code generation or mutation.

Text formatting is intentionally bounded to common typographic properties. Font
family selection, colour editing, shadows, variable-font axes and arbitrary CSS
entry are not part of this proof.

## Boundary

Beta 2 remains the stable annotation notebook. Beta 3 is an additive local
proof of direct manipulation in a frozen layered overlay.

The broader accepted architecture remains in
[`architecture/FROZEN_LAYERED_SNAPSHOT.md`](architecture/FROZEN_LAYERED_SNAPSHOT.md).
