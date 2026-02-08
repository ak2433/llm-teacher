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

def get_time_ago(timestamp: str) -> str:
    """
    Convert an ISO timestamp into a human-friendly string
    like: '5 minutes ago' or '2 days ago'
    """
    if not timestamp:
        return "Never"

    try:
        # Convert ISO string back into a datetime object
        dt = datetime.fromisoformat(timestamp)
        now = datetime.now()
        diff = now - dt

        seconds = diff.total_seconds()

        if seconds < 60:
            return "Just now"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif seconds < 604800:
            days = int(seconds / 86400)
            return f"{days} day{'s' if days != 1 else ''} ago"
        elif seconds < 2592000:
            weeks = int(seconds / 604800)
            return f"{weeks} week{'s' if weeks != 1 else ''} ago"
        else:
            months = int(seconds / 2592000)
            return f"{months} month{'s' if months != 1 else ''} ago"
    except Exception:
        return "Unknown"

def get_all_subjects() -> List[Dict]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, progress, last_message_at, icon, created_at
            FROM subjects
            ORDER BY last_message_at DESC NULLS LAST, created_at DESC
        """)
    subjects = []
    for row in cursor.fetchall():
        subjects.append({
                "id": row["id"],
                "name": row["name"],
                "progress": row["progress"],
                "lastMessage": f"Last session {get_time_ago(row['last_message_at'])}",
                "icon": row["icon"] or "📚"
            })
    return subjects

def get_subject_by_id(subject_id: int) -> Optional[Dict]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, progress, last_message_at, icon, created_at
            FROM subjects
            WHERE id = ?
        """, (subject_id,))
        row = cursor.fetchone()
        if row:
            return {
                "id": row["id"],
                "name": row["name"],
                "progress": row["progress"],
                "lastMessage": f"Last session {get_time_ago(row['last_message_at'])}",
                "icon": row["icon"] or "📚"
            }
    return None

def create_subject(name: str, icon: str = "📚") -> Dict:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO subjects (name, progress, last_message_at, icon, created_at)
            VALUES (?, 0, NULL, ?, datetime('now'))
        """, (name, icon, datetime.now().isoformat()))
        subject_id = cursor.lastrowid

        return {
            "id": subject_id,
            "name": name,
            "progress": 0,
            "icon": icon,
            "lastMessage": "Just now"
        }

def get_all_subjects() -> List[Dict]:
    """
    Fetch all subjects from the database,
    sorted by most recent activity.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, name, progress, last_message_at, icon, created_at
            FROM subjects
            ORDER BY last_message_at DESC NULLS LAST, created_at DESC
        """)

        subjects = []

        # Convert each database row into a Python dict
        for row in cursor.fetchall():
            subjects.append({
                "id": row["id"],
                "name": row["name"],
                "progress": row["progress"],
                "lastMessage": f"Last session {get_time_ago(row['last_message_at'])}",
                "icon": row["icon"] or "📚"
            })

        return subjects

    
   