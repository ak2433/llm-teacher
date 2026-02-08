# This will handle the database for users and their progress.
import sqlite3
from datetime import datetime
from typing import List, Optional, Dict

DATABASE_PATH= "backend/database.db"

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row # tHIS is used so that we can use row["name"] instead of row[0]

    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL
        )
        """)
        conn.commit()

        print("Database initialized")

