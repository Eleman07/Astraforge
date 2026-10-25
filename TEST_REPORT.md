# AstraForge 4.2 — test report

## Bug addressed

The bundled `astra_simulator_client` wheel was included on the site, but the application only loaded it via the manual **Load selected packages** action. `pyodide.loadPackagesFromImports` does not install arbitrary bundled Python wheels.

## Changes

- The browser worker proactively runs the bundled ASTRA install before running scripts containing `import astra` or `from astra... import ...`.
- Running while the Aerospace profile has the bundled ASTRA client selected also installs the SDK on demand.
- Installation is deduplicated across runs of one active worker; **Reset** starts a new runtime.
- Installation failures include the precise URL to troubleshoot.
- Service Worker cache bumped to `astraforge-ghpages-v6-astra-autoload`.

## Checks completed

- `node --check` — **PASS** for worker.js, app.js, sw.js and catalog.js.
- `node tests/catalog.test.mjs` — **PASS**, 16 profiles with 87 catalog entries.
- `node tests/test_ast_sdk.cjs` — **PASS**, mocked Web Worker/Pyodide exercise package dedupe, non-browser package rejection, execution order and ASTRA auto-install.
- `node tests/test_ast_sdk_imports.cjs` — **PASS**, import ASTRA variants and Aerospace mode against mocked Python runtime.
- `pip install --target` from provided wheel + `import astra; from astra.client import AstraClient` — **PASS**, SDK version 1.3.0 in standard Python.
- Local HTTP GET `/wheels/astra_simulator_client-1.3.0-py3-none-any.whl` — **PASS**, 200 and 4164 bytes.
- Browser E2E and real Pyodide installation on GitHub Pages — **NOT VERIFIED**. Chromium launched, but container policy blocked navigation to localhost; external Pyodide CDN was not available for end-to-end testing.

This release has not been pushed to GitHub automatically. Run the steps in `GITHUB_UPDATE_IT.md`.
