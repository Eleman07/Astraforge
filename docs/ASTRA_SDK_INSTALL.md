# ASTRA Simulator Client SDK 1.3.0 — Installation and Browser Integration

## Use in AstraForge 4.3 (GitHub Pages)

**No separate Python server is needed.** The ASTRA wheel is included in `wheels/` and installed on demand through Pyodide's `micropip`. When user code accesses `AstraClient`, AstraForge loads the MIT-licensed ASTRA physics source (pinned to a tested upstream commit) into the same WebAssembly interpreter and routes the SDK calls directly to the `browser_bridge.route_raw()` dispatcher.

1. Open https://eleman07.github.io/Astraforge/.
2. Choose **Aerospace engineering**.
3. Press **Create ASTRA simulator example**.
4. Click **Run**. On first use you should see progress for the SDK wheel and 22 Python core source files.

```python
from astra.client import AstraClient
sim = AstraClient()
print(sim.status())
print(sim.models())
sim.reset(vehicle="space", scenario="mission")
sim.launch()
for i in range(10):
    print(sim.step(0.1)["time_s"])
```

The normal SDK method names are preserved. In AstraForge, `AstraClient(base_url="browser://astra")` also works. The old localhost base URL is treated as a backwards-compatible alias **only inside the PWA**. Explicit remote URLs now produce a clear error, since the adapter is local, not an HTTP client.

Other SDK APIs (when implemented by upstream ASTRA) include `engineering_models()`, `engineering("beam", ...)`, `convergence()`, `robustness()`, `inject_fault()` and `clear_faults()`. Some expensive operations may be slow on mobile hardware.

### Python on Ubuntu / an actual server

Outside AstraForge, the original wheel still uses the standard `urllib` HTTP client. To use it with the traditional simulator server:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install ./astra_simulator_client-1.3.0-py3-none-any.whl
# In a different terminal from the ASTRA Aerospace Simulator repository:
python3 server.py --open
```

Then from a native Python process, use:

```python
from astra.client import AstraClient
sim = AstraClient(base_url='http://127.0.0.1:8765')
print(sim.status())
```

This native-server workflow is **optional** and unrelated to the browser bridge.

### Requirements and boundaries

- Modern browser with WebAssembly and module Workers; initial access to Pyodide CDN and public ASTRA GitHub assets.
- Each tab owns independent simulation state; the standalone ASTRA 3D viewer is not synchronized with AstraForge state.
- Browser JavaScript and Python code is inspectable. Never store shared OpenRouter credentials in GitHub Pages source.
- Python ASTRA core source revision: `e5e8d16ae08d026d776e57f117fc677cb7084706` from `Eleman07/ASTRA-Aerospace-Simulator` (MIT).
- ASTRA wheel remains `astra_simulator_client-1.3.0-py3-none-any.whl` (Python ≥3.10, pure Python).
- The worker checks installation, invokes an ASTRA status self-test and reports loader errors in the output pane. The real public-site networking path must be tested after publication.
