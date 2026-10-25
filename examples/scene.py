"""Aerospace 3D visualization with browser-native WebGL animations and Python callbacks.
ModernGL's native OpenGL is not used; Three.js renders the geometry on GPU.
"""
from math import cos, sin, pi
from astraforge_web import sphere, box, path, show_scene, set_scene_object, on

R = 6.0
N = 120
trajectory = [(R*cos(2*pi*k/N), 0.2*sin(4*pi*k/N), R*sin(2*pi*k/N)) for k in range(N+1)]
frames = [{'satellite': trajectory[k]} for k in range(N)]

@on('satellite_pick')
def highlight_satellite(values):
    set_scene_object('satellite', color='#ee8f76', radius=0.48)
    print('Selected:', values['__target__'], ' — highlighted by a Python callback')

show_scene([
    sphere(0, 0, 0, 1.5, '#407fc7', id='earth'),
    sphere(*trajectory[0], radius=.35, color='#f3cf83', id='satellite', on_click='satellite_pick'),
    path(trajectory, '#81b7ef', id='orbit_path'),
    box(0, -2.5, 0, size=(1.4,.3,1.4), color='#7db49e', id='reference'),
], title='Animated satellite orbit · tap satellite to change color',
   frames=frames, fps=30, loop=True)
print('3D Preview: Play/Pause, drag to rotate, pinch to zoom, tap satellite.')
