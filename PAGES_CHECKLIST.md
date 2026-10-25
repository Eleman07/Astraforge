# AstraForge 4.2 — GitHub Pages release checklist

1. Copy the root files `index.html`, `app.js`, `catalog.js`, `worker.js`, `style.css`, `sw.js`, `manifest.webmanifest`, `.nojekyll`, `README.md` and directories `icons/`, `docs/`, `tests/`, `wheels/` into the repository root on `main`.
2. Verify Settings → Pages is enabled on `main / (root)` or the existing Pages workflow is active.
3. Site URL: https://eleman07.github.io/Astraforge/ (case-sensitive path).
4. Reload without cache (Ctrl+Shift+R) after updating: legacy service workers may still serve older JS until activation.
5. In the browser, run `print(2 + 2)` and ensure `4` appears. Then import NumPy and Astropy (download on demand).
6. Choose Aerospace and install the selected modules, including `wheels/astra_simulator_client-1.3.0-py3-none-any.whl`. Test `import astra; print(astra.__version__)` (expect `1.3.0`).
7. Check distinct profiles: Biomedical → Biopython; Energy → CoolProp; Telecommunications → bitstring; AI → scikit-learn.
8. Search all modules for `django`, `tkinter` or `pyfme`: labels must show Desktop / server and the install checkbox must be disabled.
9. Verify local save/reload, file import/export, responsive mobile layout, and optional OpenRouter behavior with a disposable personal API key.
10. Verify the JS console has no CDN, WebAssembly or CSP errors. If the download from `cdn.jsdelivr.net` is blocked, try a different network; do not assume Pyodide has been packaged into the small repository ZIP.

Technical references: https://pyodide.org/en/stable/usage/webworker.html and https://pyodide.org/en/stable/usage/packages-in-pyodide.html

11. Select Aerospace and **Run** `import astra; print(astra.__version__)` without pressing Load selected packages. Expected: `1.3.0`.
12. Run the same script again: it should not reinstall the wheel (until runtime reset).
