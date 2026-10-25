# AstraForge 4.1 — Python engineering IDE

A responsive, client-side Python 3.14 IDE for engineering and scientific work. Deployed as static files on GitHub Pages. [Engineering portfolio](https://elemanprojects.com).

![AstraForge desktop IDE](docs/preview-desktop.png)

## Technical overview

- **Python 3.14**: Pyodide `314.0.7` runs in a **module Web Worker**. This corrects the previous `importScripts()` loading failure. A compatible browser and network access to `cdn.jsdelivr.net` are required on first use.
- **Library catalog**: 16 engineering/science profiles and 87 catalog entries, with selected recommended packages and on-demand installation. 6 marked desktop/server-only entries are intentionally not installable on GitHub Pages.
- **Aerospace**: Astropy, REBOUND/REBOUNDx, CasADi, SciPy, NumPy, SymPy, Matplotlib, galpy, Cartopy, CoolProp and the bundled **ASTRA Simulator Client 1.3.0**.
- **Other disciplines**: mechanics, computers, electronics, electrical systems, chemical processes, energy, management, materials, biomedical, automation, AI, telecommunications, mathematics and physics. Each profile exposes relevant specialized libraries.
- **Editor and output**: file tabs, keyboard shortcuts, local IndexedDB storage, file import/export and Matplotlib PNG output.
- **Optional AI**: user-provided OpenRouter API key, never hardcoded or stored; prompt and current code are transmitted to OpenRouter only if the user clicks Send.
- **Responsive UI**: editor / Explorer / console / assistant layout; drawer navigation on small screens.

## Use in GitHub Pages

1. Upload the **contents of this folder** to the **root** of the public repository `Eleman07/Astraforge` (branch `main`). Do not upload just the ZIP or a containing directory.
2. GitHub repository → **Settings → Pages** → **Deploy from branch** → `main` → `/(root)` → **Save**. Alternatively keep an already working Actions-based Pages deployment.
3. Visit [AstraForge on GitHub Pages](https://eleman07.github.io/Astraforge/).
4. In the browser, choose a discipline, press **Load selected packages**, and then **Run**. Standard library examples run without loading STEM toolkits.
5. If a previous site version remains visible, perform **Ctrl+Shift+R**; if necessary remove the old service worker in DevTools → Application → Service Workers and reload.

The static site contains `index.html`, `app.js`, `catalog.js`, `worker.js`, `style.css`, `sw.js`, `manifest.webmanifest`, `/icons` and `/wheels`.

## Recommended toolkit modules and compatibility

Package names shown with no warning are included in the official [Pyodide 314.0.7 package index](https://pyodide.org/en/stable/usage/packages-in-pyodide.html), although particular workflows may still be limited by WebAssembly/browser capabilities or memory. **Packages are NOT all downloaded at startup.**

| Profile | Typical recommended libraries |
|---|---|
| Aerospace | `astropy`, `rebound`, `casadi`, `numpy`, `scipy`, `sympy`, `matplotlib`, ASTRA SDK |
| Mechanical | `coolprop`, `casadi`, `numpy`, `scipy`, `sympy`, `uncertainties` |
| Computer science | `pytest`, `pandas`, `networkx`, `pyyaml`, `numpy`, `rich` |
| Electronics | `inspice`, `pywavelets`, `scipy`, `numpy`, `sympy` |
| Electrical | `networkx`, `coolprop`, `casadi`, `scipy`, `numpy` |
| Chemical | `coolprop`, `numpy`, `scipy`, `pandas`, `sympy` |
| Energy | `coolprop`, `highspy`, `scipy`, `numpy`, `pandas` |
| Management | `highspy`, `statsmodels`, `networkx`, `pandas`, `scipy` |
| Biomedical | `biopython`, `scikit-image`, `scipy`, `pandas`, `numpy` |
| Materials | `scikit-image`, `coolprop`, `scipy`, `pandas`, `numpy` |
| Automation / robotics | `casadi`, `scipy`, `numpy`, `sympy`, `matplotlib` |
| AI | `scikit-learn`, `xgboost`, `numpy`, `pandas`, `matplotlib` |
| Telecommunications | `pywavelets`, `bitstring`, `networkx`, `scipy`, `numpy` |
| Mathematics | `sympy`, `mpmath`, `statsmodels`, `scipy`, `numpy` |
| Physics | `unyt`, `uncertainties`, `scipy`, `sympy`, `numpy` |
| General Python | `pytest`, `pandas`, `numpy`, `sympy`, `matplotlib` |

### Not supported as executable browser packages

- **Tkinter** — needs a desktop GUI runtime and a Tk display, which browsers cannot provide.
- **Django** — server-side HTTP app framework; GitHub Pages cannot start or host Django's server.
- **PyFME** — legacy flight mechanics engine; requires separate compatible native Python verification. Its official repository indicates that it is no longer maintained.
- **PyTorch/CUDA**, **pyserial**, **RDKit** — listed as external tools or requiring further compatibility work; the UI does not claim they are installed.

This list is clearly labeled **Desktop / server** in the IDE and those entries are disabled for browser installation.

## ASTRA SDK

The pure-Python file `wheels/astra_simulator_client-1.3.0-py3-none-any.whl` is installed using `micropip` when **ASTRA Simulator Client** is selected under Aerospace and you press **Load selected packages**.

```python
import astra
from astra.client import AstraClient
print(astra.__version__)  # 1.3.0
```

The client package may import successfully but its standard `urllib` network transport will not directly work against a remote ASTRA server from the browser. Remote calls require an HTTPS/CORS API and browser-compatible transport, implemented separately. See [SDK installation notes](docs/ASTRA_SDK_INSTALL.md).

**License caution:** if you publish this repository, the wheel is also publicly downloadable. Make sure distribution is permitted.

## Local development

From this directory, run:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Do not open `index.html` as a `file://` URL: workers, ES modules and service workers require an HTTP(S) origin.

Check the static JavaScript and catalog tests:

```bash
node --check app.js
node --check worker.js
node --check catalog.js
node tests/test_ast_sdk.cjs
node tests/catalog.test.mjs
```

### Limitations and security

Pyodide runs on the user's device, not in a cloud Python process. Native Tk GUIs, persistent servers, unported compiled packages, direct arbitrary sockets, hardware access and heavy GPU workloads are not equivalent to desktop/server Python. Running many large packages may exceed mobile RAM. Browser offline support is best-effort and **a first-run network connection is required**. The local project store belongs to one browser and is not synchronized across devices. Code and runtime execution have *not* been independently verified on the live Pages deployment as part of this package release.
