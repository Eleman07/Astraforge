# Tkinter-style controls rendered as WEB COMPONENTS (not native tkinter)
from astraforge_web import show_ui
show_ui('Engineering settings', [
    {'type':'label','text':'AstraForge browser UI demonstration'},
    {'type':'input','text':'Vehicle mass (kg)','value':'1200'},
    {'type':'input','text':'Desired altitude (m)','value':'400000'},
    {'type':'checkbox','text':'Enable stability control'},
    {'type':'button','text':'Preview settings'},
])
print('Web UI generated. Click Web UI to inspect it.')
