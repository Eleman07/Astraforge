# ASTRA Simulator Client SDK — Python Installation and Browser Compatibility

## Package overview

- **Distribution:** `astra-simulator-client`
- **Version:** `1.3.0`
- **Python compatibility declared by the wheel:** Python 3.10+
- **Module import:** `from astra.client import AstraClient`
- **Archive:** `astra_simulator_client-1.3.0-py3-none-any.whl` (`py3-none-any`, pure Python, no declared dependencies)
- **SHA-256:** `8198b833475948517ded0ae616dad4f82b15bee58290e0c5a2f3086e711b80cd`

The SDK provides Python methods that invoke the **separately running ASTRA HTTP API**: spacecraft state, engineering analyses, commands, guidance and reset/step operations. **It is not the ASTRA simulation engine.**

## Installing in AstraForge on GitHub Pages

1. Open AstraForge in your browser.
2. Select **Aerospace engineering** under *What do you study / do?*.
3. Ensure **ASTRA Simulator Client · 1.3.0** is checked.
4. Click **Load selected modules**.
5. Check the output for `ASTRA SDK v1.3.0 installed and import verified.`
6. In the Python editor run:

```python
import astra
from astra.client import AstraClient

print(astra.__version__)
print(AstraClient)
```

This installs the included wheel with Pyodide `micropip` from the same site. No server-side Python or `pip` installation takes place. The package must be installed again after resetting the worker/reloading unless its download is cached; package imports aren't persistent across a new interpreter.

## Installing with standard Python on a PC or server

Download `astra_simulator_client-1.3.0-py3-none-any.whl` from the IDE repository's `wheels/` directory and run:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install ./astra_simulator_client-1.3.0-py3-none-any.whl
python -c "from astra.client import AstraClient; import astra; print(astra.__version__)"
```

If the ASTRA simulator API runs locally on that same machine, an example is:

```python
from astra.client import AstraClient

sim = AstraClient(base_url="http://127.0.0.1:8765")
print(sim.status())
```

The last call succeeds only when the independent ASTRA API is reachable. The SDK's default timeout is 15 seconds; long analyses use a separate timeout.

## Important: calling ASTRA from a web browser

**Installation and import work; regular HTTP methods do not automatically work in Pyodide.** This wheel's methods use `urllib.request.urlopen`, which needs Python socket/network support absent from ordinary browser Pyodide. A working remote ASTRA experience requires:

- an ASTRA simulator server reachable from the user device using HTTPS;
- a browser-safe asynchronous transport using the `fetch` API or an explicitly supported proxy;
- CORS enabled on the ASTRA server for the site's origin;
- appropriate authentication/rate limiting and permission boundaries.

The current release does not install such an adapter and does not silently rewrite or proxy your simulator requests. In particular, `http://127.0.0.1:8765` on a mobile phone refers to the **phone** and cannot reach a server on your PC.

## Publication and intellectual-property notice

GitHub Pages distributes static files publicly. Anyone visiting the IDE can download the wheel and inspect its Python source. If this SDK is proprietary, do **not** publish it with a public GitHub Pages repository without authorization to distribute it.

## AstraForge 4.2 automatic installation

When running a Python file containing `import astra` or `from astra.client import AstraClient`, the browser worker now installs the site-hosted wheel automatically using `micropip`. Selecting Aerospace (with ASTRA SDK still selected) also installs the wheel on the first **Run**. No virtual environment or desktop `pip` is required.
