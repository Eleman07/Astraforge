# AstraForge Interactive Studio — Python SDK

**Version 5.1 · Python 3.14 / Pyodide · WebGL / browser-native forms / SQLite**

This SDK is part of AstraForge's browser runtime. It is not a byte-for-byte replacement for `tkinter`, `moderngl` or a database server. It runs in a Pyodide module Web Worker and exchanges structured messages with the UI. No VPS or desktop companion is required.

## 1. Interactive forms (Tkinter-style)

Import `show_ui`, `on`, and `set_control` from `astraforge_web`.

```python
from astraforge_web import show_ui, on, set_control

@on('multiply')
def multiply(values):
    number = float(values['number'])
    set_control('answer', text=f'Result: {number * 2:.2f}')

show_ui('Quick calculator', [
    {'type': 'input', 'id': 'number', 'text': 'Number', 'value': '7'},
    {'type': 'button', 'id': 'run', 'text': 'Calculate', 'on_click': 'multiply'},
    {'type': 'label', 'id': 'answer', 'text': 'Waiting'},
])
```

Click **Run** then switch to **Web UI**. Changing input values and clicking **Calculate** invokes the registered Python function without restarting the script.

`@on(event_name)` accepts a short identifier and registers `def callback(values): ...`. `values` contains each field's `id` mapped to its current value and `__target__` for the control/object causing the event. Inputs can set `on_change`, buttons set `on_click`. A new **Run** clears previous callback registrations.

Available controls: `label`, `input`, `button`, `checkbox`, `slider`, `select`, `textarea`, `progress`. IDs must be unique. `set_control(id, text=..., value=...)` refreshes the current form. Text is inserted using DOM `textContent`, not injected as HTML. There is a 60-control limit.

**Not supported:** `import tkinter`, `tk.Tk()`, `mainloop()`, ttk, native OS dialogs or full Tkinter compatibility.

## 2. Interactive 3D (ModernGL-style browser alternative)

```python
import math
from astraforge_web import show_scene, sphere, path, on, set_scene_object

orbit = [[5 * math.cos(i * .05), 0, 5 * math.sin(i * .05)] for i in range(120)]

@on('pick')
def on_satellite_click(values):
    set_scene_object('sat', color='#ff9955', radius=0.4)
    print('Selected:', values['__target__'])

show_scene([
    sphere(0,0,0,1.0, id='earth', color='#4477bb'),
    sphere(*orbit[0],radius=.25,id='sat',on_click='pick'),
    path(orbit, id='orbit', color='#8bbbec')
], frames=[{'sat':p} for p in orbit], fps=30, loop=True)
```

Open **3D Preview**, tap/click the satellite, use Play/Pause for frames, drag to rotate or pinch/scroll to zoom. Rendering happens with Three.js/WebGL on the local GPU; Python does **not** run on every animation frame. Precompute at most 1,500 frames and 100 scene objects. Supported primitives are sphere, box and path. Use `set_scene_object(id, position=..., color=..., radius=...)` inside a registered callback.

**Not supported:** native ModernGL contexts, arbitrary GLSL fragment shaders, OpenGL framebuffer APIs, native `.run()` loops or automatic conversion of existing ModernGL applications. Port the physics/scene-description layer to the browser API.

## 3. Local SQL database and visual editor

The standard-library `sqlite3` module is available through Pyodide:

```python
import sqlite3
with sqlite3.connect('engineering.db') as conn:
    conn.execute('CREATE TABLE IF NOT EXISTS telemetry (time_s REAL, altitude_m REAL)')
    conn.execute('INSERT INTO telemetry VALUES (?, ?)', (1.2, 140.6))
```

After running your Python script, open the **Database** tab. You can execute SQL in the console, click **Refresh** to select a table, view up to 200 rows, edit and delete rows in ordinary SQLite rowid tables, add rows with prompted field values, and create basic tables through the UI. Query arguments are parameterized when writing through the table editor. `WITHOUT ROWID` tables are read-only in the visual editor but can be queried with SQL.

Import and export `.db`, `.sqlite` and `.sqlite3` files; each file is limited to 4 MiB for IndexedDB persistence. Browser storage is **local per device and origin**, not Google Drive, and can be cleared by the user or the browser. Always export important data. Do not assume unlimited offline capacity.

Optional Pyodide packages SQLAlchemy, DuckDB and Peewee are listed in the STEM toolkit, but only SQLite database file persistence is implemented in the visual editor. This is not a hosted PostgreSQL/MySQL database.

## 4. GitHub Pages deployment

Static files at the repository root include `worker.js`, `app.js`, `webviz.js`, `astraforge_web.py`, `astraforge_db.py`, `sw.js`, `style.css`, `examples/`, and other existing AstraForge files. Publish these files together. Open <https://eleman07.github.io/Astraforge/> after the Pages workflow succeeds.

For local testing:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Pyodide and Three.js download from CDN on initial load. Native tkinter, ModernGL, Django and PyFME programs remain incompatible without adaptation. This browser-first API provides a free interactive alternative, not API-level compatibility with those libraries.
