# AstraForge 4.4 — Browser + Native Python

AstraForge is a browser-hosted Python engineering IDE with two explicit execution targets:

1. **Browser Pyodide 3.14** — default, works on GitHub Pages and supported mobile devices, retains ASTRA simulation bridge and curated STEM packages.
2. **Native desktop/server** — opt-in companion on the **same personal computer** for Tkinter, Django, ModernGL and best-effort PyFME.

The native companion is intentionally loopback-only, token-protected, and NOT a public multi-user execution server. Native GUI windows appear on the computer running the companion. See `desktop_companion/README.md` and `GITHUB_UPDATE_IT.md`.

The GitHub Pages site's source is static. Installing native packages is not performed by GitHub Pages or by Pyodide; it occurs in a separate Python environment on your own computer.

Website: https://eleman07.github.io/Astraforge/ · Portfolio: https://elemanprojects.com
