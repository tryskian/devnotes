# Sketchie and DevNotes handoff concept

Date: 6 October 2026
Status: proposed, not implemented

## Why this emerged

Sketchiebook and DevNotes now support adjacent parts of the same collaborative
loop:

- Sketchiebook owns saved visual sources, image regions, prompts, notes and
  replies.
- DevNotes owns live-page selections, DOM context, implementation notes,
  replies and responsive visual receipts.

The existing `sketchiebook-send` operation showed the value of an explicit,
provenance-preserving handoff. The next idea is a two-way bridge rather than an
informal habit that every agent must remember independently.

## Proposed operations

### Send to DevNotes

Hand a Sketchiebook selection or whole-image note to the live implementation
surface as a visual reference.

### Send to Sketchiebook

Hand a DevNotes note, selection and current visual receipt to Sketchiebook for
visual exploration.

The first recommended implementation path is DevNotes to Sketchiebook because
it directly supports the current loop: annotate the troublesome live shape,
then move that exact evidence into a visual-thinking workspace.

## Handoff record

A handoff should preserve:

- one shared handoff ID;
- source tool and source record ID;
- destination tool and destination record ID after acceptance;
- source revision and timestamp;
- image or current visual receipt;
- selected region or live-page geometry;
- note and reply thread;
- exact generation prompt when one exists;
- source page URL or local image identity;
- direction and handoff status.

Both sides should retain a receipt. The bridge should not silently copy only the
visible prose while losing the selection, source identity or revision.

## Ownership boundary

Neither tool edits the other's storage directly.

- Sketchiebook continues to own its image notes and `.notes.json` sidecars.
- DevNotes continues to own its private notebook and snapshots.
- The bridge calls each tool's local API and records the relationship.
- Loopback-only transport remains the default. Local paths and private notes
  are not sent to a remote host.

## Possible MCP surface

```text
sketchie_devnotes.handoff_to_devnotes
sketchie_devnotes.handoff_to_sketchiebook
sketchie_devnotes.inspect_handoff
sketchie_devnotes.list_handoffs
```

These names capture the current idea only. They are not an implemented or
accepted public contract.

## Open questions

- Is the bridge its own local service, or a thin MCP facade over both existing
  APIs?
- Does DevNotes send one isolated selection receipt or the whole viewport?
- When several selections belong to one note, does Sketchiebook receive one
  composite image or one image per selection?
- Which side owns handoff status and retries?
- Should replies continue across the bridge or remain source-linked in their
  original tool?
- How should a later implementation revision link back to the visual thought
  that produced it?
