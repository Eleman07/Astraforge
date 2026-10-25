# AstraForge 4.0 — Browser PWA for GitHub Pages

An experimental **Python 3.14 browser IDE** built with Pyodide and Web Workers. It runs on the user's device, **not on GitHub servers**. The site is static and requires no VPS.

## Deploy free on GitHub Pages

1. Create an empty **public** GitHub repository named `astraforge-ide`.
2. Copy/upload the **contents of this directory** to the root of the `main` branch. Keep `index.html`, `app.js`, `worker.js`, `style.css`, `sw.js`, `manifest.webmanifest`, `icons/`, and `.nojekyll` at root.
3. In **Settings → Pages → Build and deployment** choose **Deploy from a branch**, `main`, `/(root)`; save.
4. Open `https://YOUR_USERNAME.github.io/astraforge-ide/` after deployment. Replace `YOUR_USERNAME` with your actual GitHub account name.
5. Confirm Python executes (test `print(2 + 2)`), then check Web Worker, Service Worker, manifest, local saving, smartphone layout and scientific package downloads.

**Alternatively, from Ubuntu (after creating the empty repo):**

```bash
cd astraforge_ghpages_ide
git init && git branch -M main
git add .nojekyll index.html app.js worker.js sw.js style.css manifest.webmanifest icons README.md
git commit -m "Deploy AstraForge browser IDE"
git remote add origin https://github.com/YOUR_USERNAME/astraforge-ide.git
git push -u origin main
```

### Local test before publishing

```bash
cd astraforge_ghpages_ide
python3 -m http.server 8080
# visit http://localhost:8080
```

### Subpath compatibility

GitHub Pages project sites run under `/<repo>/`. Asset URLs, service worker registration and manifest scope use relative paths (`./`); the app's manifest `id` is also relative. The site should work without setting an absolute hostname or build base URL.

### Important limitations

- GitHub Pages requires a public repository with GitHub Free; all published browser files are inspectable. **Do not upload passwords, OpenRouter API keys, Google OAuth secrets, private code or server projects.**
- The public **documentation-and-algorithms-only** project should be a **different repository**. This repository holds the running website; it is intentionally not documentation-only.
- Pyodide is fetched from a third-party CDN on demand. Full offline Python execution is not guaranteed. Native Python extensions, CUDA, Linux shell, private GitHub OAuth, cloud sync and per-user server accounts are not implemented in this static MVP.
- AI requires each user's personal OpenRouter key; the request goes to OpenRouter over the network and may have limits or costs depending on model.
- GitHub Pages is for static websites; GitHub's rules prohibit using it as free hosting for a commercial SaaS. Use this deployment for the **free educational experimental PWA**, not a commercial SaaS offering.
- GitHub Pages has service limits (site size, bandwidth and usage). Consult https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits.

See the separate Italian deployment tutorial and technical showcase repository for GitHub documentation and demo assets.


## Aerospace preset: ASTRA Simulator Client 1.3.0

The **Aerospace engineering** profile now preselects `astra-simulator-client` together with NumPy, SciPy, SymPy and Matplotlib. Click **Load selected modules** to install the checked libraries. The supplied pure-Python wheel is distributed at:

`wheels/astra_simulator_client-1.3.0-py3-none-any.whl`

The installer uses `micropip.install()` with a **same-origin wheel URL** rather than `pyodide.loadPackage()`; the latter works only for packages in the Pyodide distribution. The wheel filename was normalized from the attached `(1).whl` download to the canonical PEP 427 filename without modifying the archive contents.

Verify inside the AstraForge editor:

```python
import astra
from astra.client import AstraClient
print('ASTRA SDK:', astra.__version__)  # 1.3.0
```

**Important functional limitation:** ASTRA 1.3.0 is an HTTP client for an independently hosted ASTRA simulator. Its implementation uses the standard library's synchronous `urllib.request.urlopen()` and defaults to `http://127.0.0.1:8765`. Pyodide in browsers does not expose TCP sockets to Python; merely installing the SDK does **not** make its HTTP API calls work. For an online integration, the SDK needs a browser-capable `fetch()` adapter (or a supported proxy) plus a deployed ASTRA API with HTTPS, CORS and appropriate authentication. A phone's `localhost` is not the developer's PC.

See [ASTRA SDK installation and compatibility](docs/ASTRA_SDK_INSTALL.md).

Wheel SHA-256: `8198b833475948517ded0ae616dad4f82b15bee58290e0c5a2f3086e711b80cd`. The wheel is served publicly as part of the GitHub Pages site: don't distribute it there if it contains private code you don't intend to disclose.
