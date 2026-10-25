# GitHub Pages release checklist

- [ ] GitHub repo name exactly matches the expected URL path, e.g. `astraforge-ide`.
- [ ] `index.html`, `.nojekyll`, `sw.js`, and `manifest.webmanifest` are at repo root.
- [ ] Settings → Pages → Deploy from branch → `main`, `/(root)`.
- [ ] GitHub Actions/Pages deployment is green; public URL loads with HTTPS.
- [ ] DevTools Network shows no 404 for `app.js`, `worker.js`, `sw.js`, CSS, icons, and manifest.
- [ ] Python execution works (`print(2 + 2)`) when CDN is reachable.
- [ ] Verify save/reload restores workspace and test responsive mobile layout.
- [ ] Verify all AI keys are supplied individually by users, not embedded in repo.
- [ ] Test offline behavior, but do not assume Pyodide will be cached.
- [ ] If updating `sw.js`, increment cache ID to avoid stale assets.

- [ ] Confirm `wheels/astra_simulator_client-1.3.0-py3-none-any.whl` was uploaded (GitHub Pages serves it at the same site origin).
- [ ] Select Aerospace and click Load selected modules; verify `import astra; print(astra.__version__)` produces `1.3.0`.
- [ ] Do not mistake SDK installation for remote ASTRA HTTP connectivity: the browser needs a separate API adapter and HTTPS+CORS server.
- [ ] Ensure the wheel may legally be shared publicly.
