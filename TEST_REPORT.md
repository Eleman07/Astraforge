# AstraForge 5.0 — Verification results

**Status: application-level checks passed; live Pyodide / WebGL on public GitHub Pages remains unverified.**

## Completed

- **18 Python tests passed**, 1 Chromium UI test **skipped** because the test environment blocks browser navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`). These cover the ASTRA client adapter, static assets, sample 3D/flight dynamics/UI/Jinja2 output and SQLite creation/query with native CPython.
- **4 JavaScript/Node test suites passed**. The worker tests use a mocked Pyodide runtime; they verify ASTRA SDK installation, source load ordering and reuse, ASTRA import handling, package flags and recommended profiles. They do **not** prove live Pyodide startup.
- Separate `node --check` passed for `app.js`, `worker.js`, `webviz.js`, `sw.js` and `catalog.js`.
- Catalog validates **91 entries and 16 discipline profiles**, including SQLite (built-in), SQLAlchemy, DuckDB and Peewee.
- Service Worker references resolve to existing local assets; all HTML element IDs are unique.
- The release ZIP was verified for CRC integrity.

## Not fully tested here

1. Real Pyodide 314.0.7 downloads, importing every compiled scientific package on each mobile platform.
2. Actual GPU/WebGL rendering and gestures on an Android/iOS device.
3. SQLite persistence in actual browser IndexedDB across restarts; the standard-Python SQL example and the JavaScript worker protocol were checked separately.
4. A full live ASTRA physics execution inside the public site, or third-party AI provider connectivity.
5. Django backend, native ModernGL, Tkinter and PyFME: these are **not provided** in the browser-only version. Instead there are browser-specific examples, explicitly labelled as alternatives.

## Reproduce checks

```bash
python3 -m unittest discover -s tests -v
node --test tests/catalog.test.mjs tests/test_ast_sdk.cjs tests/test_ast_sdk_imports.cjs tests/test_browser_engine.cjs
for f in app.js worker.js webviz.js catalog.js sw.js; do node --check "$f"; done
```

See `PAGES_CHECKLIST.md` for real-device acceptance tests before announcing the release.
