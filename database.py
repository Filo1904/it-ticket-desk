import sqlite3

def get_connection():
    connection = sqlite3.connect("helpdesk.db")
    connection.row_factory = sqlite3.Row
    return connection

if __name__ == "__main__":
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'aperto',
            description TEXT NOT NULL DEFAULT '',
            priprity TEXT NOT NULL DEFAULT 'media',
            created_at TEXT
        )
    """)

    connection.commit()

    rows = connection.execute("SELECT * FROM tickets").fetchall()
    for row in rows:
        print(row["name"])

    connection.close()