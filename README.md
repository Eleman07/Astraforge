## AstraForge 5.5 — OpenRouter Key Vault (Windows 11)

Astra AI now supports **Save key on this device** and **Forget key**. The personal OpenRouter API key is kept in the current browser profile (IndexedDB) encrypted with a non-extractable Web Crypto AES-256-GCM key. It is automatically restored on subsequent visits to the same browser and is not embedded in GitHub code or the workspace. The AI model is also remembered. Saving is optional: you can use a temporary, session-only key without saving it. **This is convenience encryption, not protection against malicious same-origin scripts or access to the browser profile**. API calls still go directly to OpenRouter when the user sends a prompt.

See [Windows 11 update tutorial](GITHUB_WINDOWS_11_OPENROUTER.md) and [test report](TEST_REPORT_5_5.md).

---

# AstraForge 5.4 — Observatory Azure

AstraForge is a free, static, browser-first Python 3.14 engineering IDE hosted on GitHub Pages. Observatory is the layout and presentation refresh approved for release 5.4. It preserves the Python worker, 16 STEM profiles / 91 package entries, the browser ASTRA adapter, WebGL visualization, interactive forms, database browser, and optional OpenRouter assistant.

## Interface changes

- Desktop **dual workspace**: Python editor + terminal (left); WebGL / Web UI / Database preview and Astra AI (right).
- Azure blue (`#55B5FF`) actions and focus indicators; deep-navy surfaces; muted gold identity mark.
- Python editor with lightweight, escaped syntax highlighting drawn behind an accessible textarea; Ctrl+Enter runs code, Ctrl+S saves, Ctrl+P focuses editor.
- Functional `Ctrl+K` quick search for actual project filenames and curated packages.
- 3D first-run placeholder is explicitly labeled **illustration**. Press **Run 3D sample** to load and run the real browser Python/WebGL sample (internet needed on first load).
- Responsive panels: **Code, Visualize, Database, Astra AI** on phones and small tablets.
- Fresh PWA icons and `astraforge-ghpages-v11-observatory-azure` service-worker cache.

## Technical boundaries

The Orbit illustration is cosmetic until an actual Python `show_scene(...)` call is executed. ModernGL and Tkinter code are **not** transparently executed in-browser: these use existing browser-native bridges (Three.js/WebGL for 3D and Python-driven HTML controls). Django remains HTML preview only; true Django applications still require a backend server. These limitations are not changed by the redesign.

Python's actual Pyodide runtime, GPU rendering, service-worker caching and IndexedDB persistence still require a live-device/browser acceptance test after deployment. Static UI and mocked execution tests **do not** certify their end-to-end operation.

## Deploy to GitHub Pages on Windows 11

See [`GITHUB_WINDOWS_11.md`](GITHUB_WINDOWS_11.md). The patch is designed for the deployed 5.3 Holst version of [`Eleman07/Astraforge`](https://github.com/Eleman07/Astraforge); the full ZIP is a stand-alone 5.4 source release.

**Live app:** https://eleman07.github.io/Astraforge/
