# Aerospace 3D: orbit visualization calculated entirely on this device
from math import cos, sin, pi
from astraforge_web import sphere, box, path, show_scene
R = 6.0
trajectory = [(R*cos(t*2*pi/180), 1.2*sin(t*2*pi/180), R*sin(t*2*pi/180)) for t in range(181)]
show_scene([
    sphere(0, 0, 0, 1.6, '#4277ad'),
    sphere(*trajectory[68], radius=.35, color='#f6ca82'),
    path(trajectory, '#77adf0'),
    box(0, -2.5, 0, size=(1.3,.3,1.3), color='#7db4a0'),
], title='Orbit & attitude preview')
print('WebGL scene ready. Open 3D Preview.')
