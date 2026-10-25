# AstraForge 5.1 — Verification report

## Automated tests

- `python -m pytest tests -q`: **31 passed, 1 skipped, 3 subtests passed**.
- `node --test tests/*.cjs tests/*.mjs`: **5/5 suites passed**.
- JavaScript syntax: `app.js`, `worker.js`, `webviz.js`, `catalog.js`, `sw.js` checked with `node --check`.
- Service worker shell: all 22 relative resources exist.
- HTML: all required Studio and database controls exist.
- ZIP: SHA-256 recorded separately; Python zipfile integrity tested.

## What the tests cover

- Tkinter-style Python callbacks registered via `@on`; UI state and reactive label updates; reject unknown callbacks.
- Interactive WebGL scene descriptions, limits, object-selection callbacks, scene mutations and 120 animation frames.
- SQLite: create table, browse schema and rows, parameterized insert/update/delete, SQL injection-style identifier rejection, persistence to real SQLite files in local test workspace.
- Worker message routing for `ui_event`, `db`, `db_import`; compatibility with existing ASTRA engine and profile catalog.
- Regression tests of 5.0 legacy functionality and scientific module catalog.

## Tests that remain to be done on a real device

- The available Chromium environment cannot complete the browser navigation test; one optional browser test was skipped.
- Full Pyodide 3.14 runtime fetching, callback DOM rendering, Three.js/WebGL animation and IndexedDB persistence need **manual acceptance tests on GitHub Pages**.
- Real smartphone GPU, touch input and browser storage quotas were not verified here.
- Native Tkinter, native ModernGL shaders, Django WSGI/ASGI hosting and native PyFME execution are **not supported**. The features are browser alternatives, not API-compatible replacements.

## Manual acceptance procedure

1. Select **Tkinter-style web UI**, Create example, Run, click Calculate orbit. Changing altitude must change the computed velocity. Toggle GNC and check state remains.
2. Select **3D / WebGL orbit**, Create example, Run, Play, rotate/pinch, click/tap the satellite. It should change color.
3. Select **SQLite persistent database**, Create example, Run, Database, Refresh. Edit a score and Save, Add row, Delete. Reload browser and confirm data persists. Export `.db` as backup.
4. Run the existing ASTRA SDK demo and a simple NumPy script to rule out regression.
5. Verify the above on desktop and smartphone.
