# AstraForge 5.3 Holst — Verification

The new release **changes only CSS, static metadata/assets and the default WebGL palette**. No changes to Python runtime, worker messages, database business logic, scientific packages or user project files.

Check results are documented in `HOLST_PALETTE_TEST_REPORT.md` after running the suite. The screenshots in `docs/` use actual `index.html` + linked CSS with representative sample content, displayed by Chromium with no network resources. They are **not** evidence of successful Pyodide or Three.js loading.

Native Tkinter/Django/ModernGL/PyFME remain unsupported in the browser; the supported features are browser-native alternatives.
