"""AstraForge browser rendering bridge (Pyodide, no native GUI/server).

Use show_scene to display simple 3D primitives, or show_ui to render a
DEClarative web UI. These APIs are NOT drop-in Tkinter or ModernGL APIs.
"""

import math

_scene = None
_ui = None
_html = None


def _point(values):
    if len(values) != 3:
        raise ValueError('Expected an x/y/z vector')
    data = [float(v) for v in values]
    if not all(math.isfinite(v) and abs(v) < 1e9 for v in data):
        raise ValueError('Position values must be finite and bounded')
    return data


def sphere(x=0, y=0, z=0, radius=1, color='#6ba5e7'):
    if not (0 < float(radius) < 1e6):
        raise ValueError('Sphere radius must be positive')
    return {'type': 'sphere', 'position': _point([x, y, z]), 'radius': float(radius), 'color': str(color)}


def box(x=0, y=0, z=0, size=(1, 1, 1), color='#8bc2ab'):
    dims = _point(size)
    if any(n <= 0 for n in dims):
        raise ValueError('Box dimensions must be positive')
    return {'type': 'box', 'position': _point([x, y, z]), 'size': dims, 'color': str(color)}


def path(points, color='#f0bc7a'):
    points = [_point(p) for p in points]
    if len(points) > 8000:
        raise ValueError('Too many path points')
    return {'type': 'path', 'points': points, 'color': str(color)}


def show_scene(objects, *, title='3D preview'):
    """Send up to 100 lightweight scene objects to the WebGL renderer."""
    global _scene
    elements = list(objects)
    if len(elements) > 100:
        raise ValueError('Maximum 100 objects')
    allowed = {'sphere', 'box', 'path'}
    if any(not isinstance(e, dict) or e.get('type') not in allowed for e in elements):
        raise ValueError('Objects must be returned by sphere(), box() or path()')
    _scene = {'title': str(title)[:100], 'objects': elements}


def show_ui(title, controls):
    """Send a safe, declarative web form (not native Tkinter)."""
    global _ui
    items = list(controls)
    if len(items) > 40:
        raise ValueError('Maximum 40 controls')
    if any(not isinstance(x, dict) or x.get('type') not in ('label', 'input', 'button', 'checkbox') for x in items):
        raise ValueError('Allowed controls: label, input, button, checkbox')
    _ui = {'title': str(title)[:100], 'controls': [
        {'type': x['type'], 'text': str(x.get('text', ''))[:240], 'value': str(x.get('value', ''))[:240]}
        for x in items
    ]}


def show_html(html):
    """Preview rendered Python/Jinja templates in a sandboxed browser iframe."""
    global _html
    if not isinstance(html, str) or len(html) > 500_000:
        raise ValueError("HTML must be text up to 500 kB")
    _html = html


def take_previews():
    global _scene, _ui, _html
    result = {'scene': _scene, 'ui': _ui, 'html': _html}
    _scene = None
    _ui = None
    _html = None
    return result
