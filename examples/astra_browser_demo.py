"""AstraForge 4.3 — ASTRA Browser Engine (no server required).

Paste this into AstraForge and choose Run. First run downloads ASTRA's
pinned Python engine source; later runs reuse the current browser interpreter.
"""
from astra.client import AstraClient

sim = AstraClient()  # in AstraForge: in-process browser engine
print('STATUS:', sim.status())

models = sim.models()
print('MODEL GROUPS:', list(models))

state = sim.state()
print('CURRENT STATE:')
print('  vehicle:', state.get('vehicle'))
print('  time_s:', state.get('time_s'))

# The following calls advance the in-browser simulator (not a remote server).
# Using sim.reset(vehicle='space', scenario='mission') is also supported.
sim.reset(vehicle='space', scenario='mission')
print('STEP:', sim.step(0.1).get('time_s'))
print('CURRENT TIME:', sim.state().get('time_s'))
