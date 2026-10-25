"""AstraForge browser-native interactive Python bridge.

This is NOT a drop-in replacement for Tkinter or ModernGL. It offers event
callbacks, declarative forms, and WebGL scenes with lightweight animation.
No network server is required; Python runs in the page's Pyodide Web Worker.
"""
from __future__ import annotations
import copy
import math
import re

_scene = None
_ui = None
_html = None
_scene_current = None
_ui_current = None
_callbacks = {}
_EVENT_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9_-]{0,63}$")
_ID_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9_-]{0,63}$")
_COLORS = re.compile(r"^#[a-fA-F0-9]{6}$")


def _point(values):
    data = [float(v) for v in values]
    if len(data) != 3 or not all(math.isfinite(v) and abs(v) < 1e8 for v in data):
        raise ValueError('Expected three finite, bounded coordinates')
    return data


def _color(value):
    value = str(value)
    if not _COLORS.fullmatch(value):
        raise ValueError('Use 6-digit hexadecimal colors (#RRGGBB)')
    return value


def sphere(x=0, y=0, z=0, radius=1, color='#6ba5e7', *, id=None, on_click=None):
    if not (0 < float(radius) < 1e6):
        raise ValueError('Sphere radius must be positive')
    return {'id': id, 'type': 'sphere', 'position': _point((x, y, z)), 'radius': float(radius),
            'color': _color(color), 'on_click': on_click}


def box(x=0, y=0, z=0, size=(1, 1, 1), color='#8bc2ab', *, id=None, on_click=None):
    dims = _point(size)
    if any(n <= 0 for n in dims):
        raise ValueError('Box dimensions must be positive')
    return {'id': id, 'type': 'box', 'position': _point((x, y, z)), 'size': dims,
            'color': _color(color), 'on_click': on_click}


def path(points, color='#f0bc7a', *, id=None):
    points = [_point(p) for p in points]
    if len(points) > 8000:
        raise ValueError('Too many path points')
    return {'id': id, 'type': 'path', 'points': points, 'color': _color(color)}


def _normalize_object(obj, index):
    if not isinstance(obj, dict) or obj.get('type') not in ('sphere', 'box', 'path'):
        raise ValueError('Use sphere(), box() or path() for scene objects')
    obj = copy.deepcopy(obj)
    obj['id'] = obj.get('id') or f'object_{index}'
    if not isinstance(obj['id'], str) or not _ID_RE.fullmatch(obj['id']):
        raise ValueError('Object ID must contain letters, numbers, _ or -')
    action = obj.get('on_click')
    if action is not None and (not isinstance(action, str) or not _EVENT_RE.fullmatch(action)):
        raise ValueError('on_click must name a registered callback')
    return obj


def show_scene(objects, *, title='3D preview', frames=None, fps=24, loop=True):
    """Display a touch-controlled Three.js scene with optional precomputed frames.

    frames: list of {object_id: [x,y,z]} position changes. Each frame is rendered
    by the mobile browser GPU. Complex ModernGL shaders are not supported.
    """
    global _scene, _scene_current
    elements = [_normalize_object(obj, i) for i, obj in enumerate(objects)]
    if len(elements) > 100 or len({x['id'] for x in elements}) != len(elements):
        raise ValueError('Maximum 100 objects, each with a unique ID')
    if not 1 <= float(fps) <= 60:
        raise ValueError('fps must be between 1 and 60')
    tracks = []
    ids = {x['id'] for x in elements}
    for frame in (frames or []):
        if len(tracks) >= 1500:
            raise ValueError('Maximum 1500 animation frames')
        if not isinstance(frame, dict) or any(key not in ids for key in frame):
            raise ValueError('Animation frame references an unknown object')
        tracks.append({key: _point(value) for key, value in frame.items()})
    _scene_current = {'title': str(title)[:100], 'objects': elements,
                      'frames': tracks, 'fps': float(fps), 'loop': bool(loop)}
    _scene = copy.deepcopy(_scene_current)


def set_scene_object(object_id, *, position=None, color=None, radius=None):
    """Modify a visible object in response to a Web UI or 3D click callback."""
    global _scene
    if _scene_current is None:
        raise RuntimeError('Call show_scene() before modifying objects')
    item = next((x for x in _scene_current['objects'] if x['id'] == object_id), None)
    if item is None:
        raise KeyError(object_id)
    if position is not None:
        item['position'] = _point(position)
    if color is not None:
        item['color'] = _color(color)
    if radius is not None:
        if item['type'] != 'sphere' or not 0 < float(radius) < 1e6:
            raise ValueError('Radius requires a sphere and a positive value')
        item['radius'] = float(radius)
    _scene = copy.deepcopy(_scene_current)


def on(event):
    """Register a callback: @on('calculate') def calculate(values): ...

    values includes the latest browser input values and __target__ of the
    clicked control or 3D object. Not an arbitrary string-to-code executor.
    """
    if not isinstance(event, str) or not _EVENT_RE.fullmatch(event):
        raise ValueError('Invalid event name')
    def decorator(fn):
        if not callable(fn):
            raise TypeError('Callback must be callable')
        _callbacks[event] = fn
        return fn
    return decorator


def show_ui(title, controls):
    """Render a responsive form; pass on_click/on_change event names."""
    global _ui, _ui_current
    items = list(controls)
    if len(items) > 60:
        raise ValueError('Maximum 60 controls')
    kinds = {'label', 'input', 'button', 'checkbox', 'slider', 'select', 'textarea', 'progress'}
    result = []
    for i, item in enumerate(items):
        if not isinstance(item, dict) or item.get('type') not in kinds:
            raise ValueError('Unsupported UI control')
        ident = item.get('id') or f'control_{i}'
        if not isinstance(ident, str) or not _ID_RE.fullmatch(ident):
            raise ValueError('Invalid control ID')
        entry = {'id': ident, 'type': item['type'], 'text': str(item.get('text', ''))[:240]}
        if entry['type'] == 'checkbox':
            entry['value'] = bool(item.get('value', False))
        elif entry['type'] in ('slider', 'progress'):
            entry.update(value=float(item.get('value', 0)), min=float(item.get('min', 0)), max=float(item.get('max', 100)))
        else:
            entry['value'] = str(item.get('value', ''))[:5000]
        if entry['type'] == 'select':
            entry['options'] = [str(x)[:120] for x in item.get('options', [])][:50]
        for attr in ('on_click', 'on_change'):
            if attr in item and item[attr] is not None:
                event = item[attr]
                if not isinstance(event, str) or not _EVENT_RE.fullmatch(event):
                    raise ValueError('Invalid callback name')
                entry[attr] = event
        result.append(entry)
    if len({c['id'] for c in result}) != len(result):
        raise ValueError('Control IDs must be unique')
    _ui_current = {'title': str(title)[:100], 'controls': result}
    _ui = copy.deepcopy(_ui_current)


def set_control(control_id, *, text=None, value=None):
    """Update one UI element without re-running the full Python script."""
    global _ui
    if _ui_current is None:
        raise RuntimeError('Call show_ui() first')
    item = next((c for c in _ui_current['controls'] if c['id'] == control_id), None)
    if item is None:
        raise KeyError(control_id)
    if text is not None:
        item['text'] = str(text)[:240]
    if value is not None:
        item['value'] = bool(value) if item['type'] == 'checkbox' else str(value)[:5000] if item['type'] not in ('slider', 'progress') else float(value)
    _ui = copy.deepcopy(_ui_current)


def reset_handlers():
    """Clear handlers when a new main program starts; not on UI events."""
    global _callbacks, _scene_current, _ui_current, _scene, _ui, _html
    _callbacks = {}
    _scene_current = None
    _ui_current = None
    _scene = _ui = _html = None


def dispatch(event, values=None, *, target=None):
    """Call only an event handler explicitly registered by the current script."""
    if event not in _callbacks:
        raise ValueError(f'No Python callback registered for {event!r}')
    if not isinstance(values, dict) or len(values) > 80:
        raise ValueError('Expected input values dictionary')
    clean = {}
    for key, val in values.items():
        if not isinstance(key, str) or not _ID_RE.fullmatch(key):
            continue
        if isinstance(val, bool):
            clean[key] = val
        elif isinstance(val, (int, float)) and math.isfinite(val):
            clean[key] = val
        elif isinstance(val, str):
            clean[key] = val[:5000]
    if _ui_current is not None:
        for item in _ui_current['controls']:
            if item['id'] in clean and item['type'] in ('input', 'checkbox', 'slider', 'select', 'textarea'):
                raw = clean[item['id']]
                item['value'] = bool(raw) if item['type'] == 'checkbox' else float(raw) if item['type'] == 'slider' else str(raw)[:5000]
    clean['__target__'] = str(target or '')[:64]
    return _callbacks[event](clean)


def show_html(html):
    """Preview HTML in a sandboxed iframe, not a Django backend."""
    global _html
    if not isinstance(html, str) or len(html) > 500_000:
        raise ValueError('HTML must be text up to 500 kB')
    _html = html


def take_previews():
    global _scene, _ui, _html
    result = {'scene': _scene, 'ui': _ui, 'html': _html}
    _scene = _ui = _html = None
    return result
