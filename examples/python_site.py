# Server-free Python web page, rendered with Jinja2 in Pyodide
# This is NOT a running Django server.
from jinja2 import Template
from astraforge_web import show_html

records = ["Orbit estimation", "GNC verification", "Thermal budget"]
template = Template("""<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui;padding:28px;background:#f6f8fb;color:#162438}li{padding:8px}</style>
<h1>{{ title }}</h1><p>Rendered by Python (Jinja2) in your browser.</p>
<ul>{% for item in items %}<li>{{ item }}</li>{% endfor %}</ul></html>""")
show_html(template.render(title="AstraForge Mission Dashboard", items=records))
print('Rendered HTML via Python + Jinja2 (no Django server).')
