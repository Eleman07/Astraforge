# AstraForge 5.1 — GitHub Pages deployment checklist

1. Copy everything from this ZIP **into the root** of the public repository `Eleman07/Astraforge` (including `.nojekyll`, `examples/`, `astra-bridge/`, `wheels/`, and `astraforge_web.py`). Do not upload only the ZIP.
2. Ensure GitHub Pages serves the `main` branch from `/(root)`, or use its existing static deployment workflow.
3. Verify https://eleman07.github.io/Astraforge/ opens and loads the latest app, not the older service worker cache.
4. Select **SQLite persistent database** → Create example → Run. Open **Database**, use `engineering.db`, run `SELECT * FROM experiments;`, then export its `.db` file.
5. Select **3D / WebGL orbit** → Create example → Run. The WebGL viewport should display objects; drag on phone to rotate and pinch to zoom on smartphone and wheel zoom on desktop are supported.
6. Select **Tkinter-style web UI** → Create example → Run. Observe browser-native controls, **not** a native Tkinter window.
7. Select **Python Jinja2 page** → Create example → Run. Observe Python-rendered HTML, **not** a Django server.
8. Select **Flight mechanics (browser)** → Create example → Run. This is an educational alternative, **not** the original PyFME package.
9. Check ASTRA SDK `AstraClient()` demo still works through its browser bridge; first download requires access to the pinned upstream source.
10. Confirm all profiles remain searchable and the Database group includes SQLite, SQLAlchemy, DuckDB and Peewee.
11. Test on smartphone and desktop, including browser storage permissions and GPU limitations.
12. Check the console, runtime download, module loading and any CSP issues. **First-run online access is needed**; do not assume every scientific package works fully offline.

See `GITHUB_UPDATE_IT.md` for exact Git commands.

### New in 5.1

- [ ] Open Tkinter-style web UI, Run, change altitude and press **Calculate orbit**. The Python-computed velocity/period must change live. Checkbox state should persist after an event.
- [ ] Open 3D / WebGL orbit, Run and press Play; drag or pinch to move camera. Tap/click the satellite and verify its color changes through a Python callback.
- [ ] Open SQLite demo, Run, Database → Refresh → select experiments → Add row; change a score → Save → Delete row. Reload the page to check IndexedDB persistence, and export the database as backup.
- [ ] Clear the PWA cache if v5.0 code continues appearing; release cache ID is now `v8-interactive-studio`.
