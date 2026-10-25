# Browser-compatible flight mechanics demonstration (NOT PyFME)
from math import cos, sin
from astraforge_web import sphere, box, path, show_scene
# Educational 2D point-mass motion with quadratic drag.
g=9.80665; mass=1200; drag=.045
x,y,vx,vy=0.,0.,65.,36.
track=[]
for i in range(180):
    speed=(vx*vx+vy*vy)**.5
    ax=-drag*speed*vx/mass
    ay=-g-drag*speed*vy/mass
    vx+=ax*.08; vy+=ay*.08
    x+=vx*.08; y=max(0,y+vy*.08)
    track.append((x/35,y/25,0))
    if y==0: break
show_scene([path(track,'#e6b878'), box(*track[-1],size=(.9,.25,1.5),color='#85b8e8')], title='Flight dynamics demonstration')
print('Points:',len(track),'final range:',round(x,2),'m')
