# Persistent SQLite database: stored in this browser's IndexedDB
import sqlite3
from pathlib import Path
connection=sqlite3.connect('engineering.db')
connection.execute('CREATE TABLE IF NOT EXISTS experiments (id INTEGER PRIMARY KEY, experiment TEXT, score REAL)')
connection.execute('INSERT INTO experiments (experiment,score) VALUES (?,?)', ('GNC Monte Carlo', .975))
connection.commit()
for record in connection.execute('SELECT * FROM experiments ORDER BY id DESC LIMIT 6'):
    print(record)
connection.close()
print('Use the Database tab to query engineering.db.')
