"""Tkinter-style interactive UI: callbacks execute in the same Python worker.
This is a browser-native form, not the native tkinter module.
"""
import math
from astraforge_web import show_ui, set_control, on

MU = 3.986004418e14
EARTH_RADIUS = 6371e3

@on('orbit')
def calculate_orbit(values):
    try:
        altitude_km = float(values['altitude'])
        if not 0 <= altitude_km < 100_000:
            raise ValueError('Altitude must be between 0 and 100,000 km')
        r = EARTH_RADIUS + altitude_km * 1000
        v = math.sqrt(MU/r)
        period = 2*math.pi*math.sqrt(r**3/MU)
        set_control('answer', text=f'Velocity: {v/1000:.3f} km/s · Period: {period/60:.2f} min')
        set_control('status', text='Calculation complete · computed by Python in your browser')
    except (ValueError, KeyError) as exc:
        set_control('status', text=f'Invalid input: {exc}')

@on('toggle')
def toggle_control(values):
    set_control('status', text='GNC enabled' if values.get('gnc') else 'GNC disabled')

show_ui('Spacecraft Control Panel', [
    {'id': 'intro', 'type': 'label', 'text': 'Live input, Python callbacks, responsive web controls'},
    {'id': 'altitude', 'type': 'input', 'text': 'Orbit altitude (km)', 'value': '400'},
    {'id': 'gnc', 'type': 'checkbox', 'text': 'Enable GNC', 'value': True, 'on_change': 'toggle'},
    {'id': 'calculate', 'type': 'button', 'text': 'Calculate orbit', 'on_click': 'orbit'},
    {'id': 'answer', 'type': 'label', 'text': 'Press Calculate orbit'},
    {'id': 'status', 'type': 'label', 'text': 'Ready'},
])
print('Open Web UI and click Calculate orbit — Python handles the event.')
