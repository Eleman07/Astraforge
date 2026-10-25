"""AstraForge SQLite table explorer and safe CRUD operations in a Pyodide FS.

The browser transports JSON values to this module. Identifiers are checked
against SQLite metadata and quoted; data values are always SQL parameters.
"""
from __future__ import annotations
import os
import re
import sqlite3

WORKSPACE = '/home/pyodide/workspace'
_NAME = re.compile(r'^[A-Za-z0-9_-]{1,64}\.(db|sqlite|sqlite3)$')


def _quote(name):
    return '"' + str(name).replace('"', '""') + '"'


def _schema(conn, table):
    names = {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")}
    if table not in names:
        raise ValueError('Unknown table')
    columns = [{'name': row[1], 'type': row[2] or 'TEXT', 'required': bool(row[3]), 'primary_key': bool(row[5])}
               for row in conn.execute(f'PRAGMA table_info({_quote(table)})')]
    return columns


def _rows(conn, table, limit=100):
    # Only rowid tables are editable via the visual interface. WITHOUT ROWID
    # tables can still be queried in the SQL editor.
    try:
        cursor = conn.execute(f'SELECT rowid AS __af_rowid, * FROM {_quote(table)} LIMIT ?', (min(200, max(1, int(limit))),))
        return {'editable': True, 'columns': [x[0] for x in cursor.description], 'rows': [list(x) for x in cursor.fetchall()]}
    except sqlite3.OperationalError as err:
        if 'rowid' not in str(err).lower():
            raise
        cursor = conn.execute(f'SELECT * FROM {_quote(table)} LIMIT ?', (min(200, max(1, int(limit))),))
        return {'editable': False, 'columns': [x[0] for x in cursor.description], 'rows': [list(x) for x in cursor.fetchall()]}


def perform(database, command):
    if not isinstance(database, str) or not _NAME.fullmatch(database):
        raise ValueError('Invalid SQLite filename')
    if not isinstance(command, dict):
        raise ValueError('Invalid database request')
    os.makedirs(WORKSPACE, exist_ok=True)
    connection = sqlite3.connect(os.path.join(WORKSPACE,database))
    try:
        connection.execute('PRAGMA busy_timeout=1000')
        action = command.get('action', 'tables')
        if action == 'tables':
            names = [row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
            return {'tables': names}
        if action == 'create':
            table = command.get('table')
            if not isinstance(table, str) or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_]{0,63}', table):
                raise ValueError('Table name must contain only letters, numbers and underscores')
            raw = command.get('columns')
            if not isinstance(raw, list) or not 1 <= len(raw) <= 20:
                raise ValueError('Choose 1–20 columns')
            cols = []
            for entry in raw:
                name, datatype = entry.get('name'), entry.get('type', 'TEXT')
                if not isinstance(name, str) or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_]{0,63}', name) or datatype not in ('TEXT','INTEGER','REAL','BLOB'):
                    raise ValueError('Invalid field name or type')
                cols.append(f'{_quote(name)} {datatype}')
            if len(set(x.get('name') for x in raw)) != len(raw):
                raise ValueError('Duplicate column names')
            connection.execute(f'CREATE TABLE {_quote(table)} ({", ".join(cols)})')
            connection.commit()
            return {'created': table}
        table = command.get('table')
        schema = _schema(connection, table)
        valid = {col['name'] for col in schema}
        if action == 'browse':
            return {'table': table, 'schema': schema, **_rows(connection, table)}
        if action in ('insert', 'update'):
            values = command.get('values')
            if not isinstance(values, dict) or not values or any(k not in valid for k in values):
                raise ValueError('Invalid field values')
            names = list(values)
            parameters = list(values.values())
            if any(not isinstance(x,(str,int,float,bool,type(None))) or isinstance(x,str) and len(x)>10000 for x in parameters):
                raise ValueError('Invalid data type or large field')
            if action == 'insert':
                question_marks = ','.join('?' for _ in names)
                connection.execute(f'INSERT INTO {_quote(table)} ({", ".join(map(_quote,names))}) VALUES ({question_marks})', parameters)
            else:
                rowid = command.get('rowid')
                if not isinstance(rowid, int) or isinstance(rowid, bool):
                    raise ValueError('Row ID must be an integer')
                updates = ', '.join(f'{_quote(name)}=?' for name in names)
                connection.execute(f'UPDATE {_quote(table)} SET {updates} WHERE rowid=?', (*parameters,rowid))
            connection.commit()
            return {'saved': True, 'table': table, 'schema': schema, **_rows(connection, table)}
        if action == 'delete':
            rowid = command.get('rowid')
            if not isinstance(rowid, int) or isinstance(rowid, bool):
                raise ValueError('Invalid Row ID')
            connection.execute(f'DELETE FROM {_quote(table)} WHERE rowid=?', (rowid,))
            connection.commit()
            return {'deleted': True, 'table': table, 'schema': schema, **_rows(connection, table)}
        raise ValueError('Unsupported database operation')
    finally:
        connection.close()
