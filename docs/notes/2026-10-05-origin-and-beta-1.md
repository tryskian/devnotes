# DevNotes origin and Beta 1

Date: 5 October 2026

## The need

The portfolio landing page was being reviewed in a live browser. Krystian could
use browser development tools, but wanted a more direct shared surface:

- select the exact part of a live interface he was referring to;
- use a polygonal lasso as well as ordinary geometry;
- write a note beside the selected area;
- let a coding agent see the same page, selection and comment;
- keep the tool separate from Sketchiebook rather than forcing live-interface
  work into an image-notes workbench.

The initial thought was "Sketchie as a devtool." The clearer product shape was
a separate local tool that borrowed the useful note interaction while owning a
different source object: a live web page rather than a saved image.

## Product identity

The working name became **DevNotes**: "DevTools, but for noties."

It began as a small local tooligan. The repository was created publicly after
the first working annotation loop existed. Its purpose was practical rather
than platform-sized: make live visual collaboration less dependent on verbal
coordinate descriptions.

## Beta 1 interaction

The first implementation established a loopback service and a bookmarklet that
could attach an annotation layer to a local page without changing the page's
source repository.

The tool grew through direct use:

1. Polygonal lasso and comment capture.
2. Rectangle, ellipse, line, arrow, double-arrow and highlight geometry.
3. Per-note colour, including black, white and colour accents.
4. Persistent tool and colour choice so repeated notes did not require repeated
   setup.
5. Live text selection using the browser's real text range.
6. Exact quotation, surrounding text context and DOM range evidence.
7. Note deletion, page clearing and editing.
8. Draggable and resizable note panels so the note could be moved away from the
   content under discussion.
9. Responsive controls and a mobile-safe dock.
10. Element evidence that could begin to reconnect an annotation to a changing
    page layout.

## Interaction decisions

- Annotation mode stays active across successive notes.
- Changing tools arms the new tool immediately.
- Start resumes the selected tool; Done or Escape returns the page to ordinary
  interaction.
- A numbered marker reopens the associated note.
- Deletion is permanent only after an explicit confirmation.
- Clear applies only to the current page URL and confirms the exact note count.
- Notes remain private in the ignored `.data/` directory.
- The annotated project is not modified by DevNotes.

The directness mattered more than visual ornament. Shapes, text selection,
notes and tool changes needed to feel like one continuous action rather than a
sequence of tool modes.

## Verified Git chronology

| Commit | Time | Verified change |
| --- | --- | --- |
| `5a09de2` | 15:06 | Establish live annotation Beta 1 |
| `1e7cf7a` | 15:12 | Add recoverable note deletion |
| `9abd718` | 15:15 | Add permanent deletion and double arrows |
| `9f940d5` | 15:21 | Keep annotation clicks above the page |
| `1ed2648` | 15:24 | Allow note deletion CORS preflights |
| `7e1a084` | 15:55 | Edit notes and clear one page's notes |
| `30c72e0` | 16:00 | Make note panels draggable |
| `877dff2` | 16:18 | Add live text selection and persistent tools |
| `29dc460` | 21:29 | Hatch DevNotes Beta 1 |

Times are Toronto local time on 5 October 2026. The commits are available in
the public [`tryskian/devnotes`](https://github.com/tryskian/devnotes)
repository.

## Boundary at the end of the day

Beta 1 proved the core annotation loop. It did not yet have versioned notebook
snapshots, reply threads, grouped selections, visual receipts, a named resident
agent or a page-scoped notation reset. Those arrived the following day.
