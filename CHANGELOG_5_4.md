# AstraForge 5.4 · Observatory Azure — GitHub changes

## Changed

- `index.html`: dual-pane IDE/visualization, functional quick-open dialog, responsive workspaces, orbit-preview illustration; retained all existing key DOM IDs.
- `app.js`: right-side studio routing without hiding terminal, mobile view selection, search for files and catalog libraries, escaped Python syntax layer, launcher for real 3D sample, viewport fallback handling.
- `webviz.js`: dark navy background and azure default colors. Real WebGL renderer and physics input API unchanged.
- `sw.js`: new PWA cache ID and stylesheet included in the offline shell.
- `manifest.webmanifest`: updated color metadata.
- `icons/*`: redesigned muted gold logo on midnight-blue background.
- `README.md`, `GITHUB_UPDATE_IT.md`, `GITHUB_WINDOWS_11.md`, `PAGES_CHECKLIST.md`, `TEST_REPORT.md`: updated documentation and acceptance checklist.
- `tests/test_holst_palette.py`, `tests/test_ast_sdk.cjs`, `tests/test_static_ide.py`: updated expected palette/cache identifiers and regression assertions.

## Added

- `observatory-theme.css`: responsive Observatory design system.
- `docs/observatory-*-preview.png`: screenshots rendered from the updated HTML/CSS/JS in Chromium; the orbit background is intentionally a labeled illustration, not a live simulation.

## Removed from FULL release

- Unused `holst-theme.css` and obsolete Holst documentation/screenshots. The PATCH instructions include manual deletion of only the old CSS when upgrading an existing checkout.

## Unchanged subsystems

- `worker.js`, `catalog.js`, `astraforge_web.py`, `astraforge_db.py`, ASTRA wheel, ASTRA source bridge, examples and scientific models.
