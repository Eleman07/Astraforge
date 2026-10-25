"""In-process adapter: ASTRA HTTP client -> ASTRA Pyodide simulation engine.

Installed into AstraForge's Pyodide interpreter after the upstream Python
simulation modules are fetched from a pinned ASTRA commit. Nothing in this
module opens a socket, starts an HTTP server, or calls urllib.
"""

import json

from browser_bridge import route_raw
from astra.client import AstraClient


_original_request = AstraClient._request
_original_init = AstraClient.__init__
_ALLOWED_BASE_URLS = frozenset({
    "browser://astra",
    "http://127.0.0.1:8765",
    "http://localhost:8765",
})


def _browser_init(self, base_url="browser://astra", *, timeout_s=15.0, long_timeout_s=300.0):
    if not isinstance(base_url, str) or base_url.rstrip("/") not in _ALLOWED_BASE_URLS:
        raise ValueError(
            "AstraForge runs the ASTRA engine in this browser, not at a remote "
            "HTTP address. Use AstraClient() or AstraClient(base_url='browser://astra'). "
            "Run standard Python outside AstraForge to connect to an HTTP server."
        )
    self.base_url = "browser://astra"
    self.timeout_s = self._validate_timeout("timeout_s", timeout_s)
    self.long_timeout_s = self._validate_timeout("long_timeout_s", long_timeout_s)


def _browser_request(self, endpoint, payload=None, *, timeout_s=None):
    if not isinstance(endpoint, str) or not endpoint.startswith("/api/v1/"):
        raise ValueError("Expected an ASTRA /api/v1/... endpoint")
    if timeout_s is not None:
        self._validate_timeout("timeout_s", timeout_s)
    request = {
        "path": endpoint.removeprefix("/api/v1"),
        "method": "GET" if payload is None else "POST",
        "payload": {} if payload is None else payload,
    }
    response = json.loads(route_raw(json.dumps(request, allow_nan=False)))
    if not response.get("ok"):
        raise RuntimeError("ASTRA Browser Engine: " + str(response.get("error", "Unknown error")))
    return response["data"]


def activate():
    """Patch only this Pyodide interpreter, preserving the public SDK methods."""
    if getattr(AstraClient, "_astraforge_browser_bridge", False):
        return AstraClient
    AstraClient.__init__ = _browser_init
    AstraClient._request = _browser_request
    AstraClient._astraforge_browser_bridge = True
    return AstraClient


def status():
    return _browser_request(None, "/api/v1/status")
