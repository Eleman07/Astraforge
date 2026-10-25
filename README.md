# AstraForge 5.0 — Free Browser Engineering Studio

AstraForge is a **static, browser-first Python 3.14 engineering IDE** intended to run on GitHub Pages at <https://eleman07.github.io/Astraforge/>. It uses Pyodide/WebAssembly on the user's device and **requires no VPS, Docker, or paid account** for the core features.

## What works in a browser

- Python 3.14 Pyodide code execution in a module Web Worker.
- 16 field-focused profiles and 91 library catalog entries, with official Pyodide packages loaded on demand.
- ASTRA simulation Python bridge (original engine modules are downloaded from a pinned public Git commit at first use).
- 3D preview using the user's device GPU via Three.js/WebGL, driven by Python-generated sphere, box, and trajectory data.
- A **browser UI** builder with declarative inputs and labels, **not** native Tkinter.
- Static HTML preview and Python-rendered Jinja2 templates in a sandboxed iframe; **not** a working Django WSGI/ASGI server.
- Lightweight flight dynamics demonstration; **not** an installation or implementation of PyFME.
- SQLite database files in the Pyodide workspace; automatic persistence to per-device IndexedDB for files **up to 4 MiB**, plus import/export of `.db` files.
- Optional SQLAlchemy, DuckDB, Peewee loaded from the official Pyodide distribution.
- OpenRouter BYOK assistant, if a suitable free model and API quota are available; availability is not guaranteed.

## Python sample — 3D visualization

```python
from astraforge_web import sphere, path, show_scene
show_scene([sphere(0, 0, 0, 2), path([(0, 0, 0), (3, 2, 1)])])
```

Run the code, then choose **3D Preview**. The editor renders the scene on the device. ModernGL's OpenGL API is **not** directly supported, and arbitrary ModernGL shaders are not translated.

## Python sample — local database

```python
import sqlite3
with sqlite3.connect('engineering.db') as conn:
    conn.execute('CREATE TABLE IF NOT EXISTS telemetry (t REAL, altitude REAL)')
    conn.execute('INSERT INTO telemetry VALUES (?, ?)', (0.1, 245.3))
```

Execute the code. The database is saved in IndexedDB on that device. Select **Database**, enter `engineering.db`, and query `SELECT * FROM telemetry;`. Download backups from the **Export .db** button. Changing browser, clearing site data, private browsing or databases over 4 MiB can result in data loss; use exports.

## Development and manual verification

```bash
cd astraforge-5.0-browser-first
python3 -m http.server 8080
# Open http://localhost:8080
```

First load requires Internet to download Pyodide, some scientific modules, and Three.js. The service worker caches the site shell, **not** the complete Python ecosystem or optional ASTRA dependencies.

Test examples in the app in this order: SQLite → Database SQL panel, 3D orbit → 3D Preview, Tkinter-style UI → Web UI, Jinja2 page → Web UI, ASTRA SDK → Python output. Test on both laptop and phone and check storage permissions and GPU support.

```bash
python -m unittest discover -s tests -v
node --check app.js
node --check worker.js
node --check webviz.js
```

## Browser boundaries

| Technology | Available browser-first alternative | Original native technology |
|---|---|---|
| ModernGL | Python-defined geometry and Three.js WebGL preview | Not supported directly |
| Tkinter | Declarative form/controls rendered as HTML | Desktop windows/callbacks unavailable |
| Django | Static pages and Python/Jinja2-generated HTML | Routing/server/database-backed views unavailable |
| PyFME | Educational flight mechanics point-mass demo | Original library not installed |
| SQLite | `sqlite3` + client-local persistence | Supported, subject to browser quota |
| SQLAlchemy, DuckDB, Peewee | Pyodide-compatible library packages | Installation/performance depends on device |

The IDE must not be used as an untrusted multiuser Python server; code runs locally on each visitor's device. No backend or native desktop companion is bundled or required.

## License and third-party sources

The ASTRA wheel and pinned simulation engine are independently licensed. Retain upstream notices and comply with their licenses if redistributing. Three.js and Pyodide have their own licenses. Nothing in the ZIP embeds a paid API key.
