"""Persistent SQLite experiment catalog: use the Database tab to edit rows."""
import sqlite3

with sqlite3.connect('engineering.db') as db:
    db.execute('''CREATE TABLE IF NOT EXISTS experiments
                  (id INTEGER PRIMARY KEY, mission TEXT NOT NULL, score REAL)''')
    if db.execute('SELECT COUNT(*) FROM experiments').fetchone()[0] == 0:
        db.executemany('INSERT INTO experiments (mission,score) VALUES (?,?)', [
            ('Orbital rendezvous', 0.985), ('Powered descent', 0.962),
            ('Aircraft trim', 0.997),
        ])
    for row in db.execute('SELECT id,mission,score FROM experiments'):
        print(row)
print('Open Database → choose engineering.db → Refresh, then edit or add rows.')
