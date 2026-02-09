# database.py
import sqlite3
from datetime import datetime
from typing import List, Optional, Dict

DATABASE_PATH = "learning_app.db"

def get_db_connection():
    """Get a database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # This allows accessing columns by name
    return conn

def init_db():
    """Initialize the database and create tables"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                progress INTEGER DEFAULT 0,
                last_message_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                icon TEXT DEFAULT '📚'
            )
        """)
        conn.commit()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise
    finally:
        conn.close()

def get_time_ago(timestamp: str) -> str:
    """Convert timestamp to human-readable 'time ago' format"""
    if not timestamp:
        return "Never"
    
    try:
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

# CRUD Operations

def create_subject(name: str, icon: str = "📚") -> Dict:
    """Create a new subject"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO subjects (name, icon, last_message_at) VALUES (?, ?, ?)",
            (name, icon, datetime.now().isoformat())
        )
        subject_id = cursor.lastrowid
        conn.commit()
        
        return {
            "id": subject_id,
            "name": name,
            "progress": 0,
            "icon": icon,
            "lastMessage": "Just now"
        }
    finally:
        conn.close()

def get_all_subjects() -> List[Dict]:
    """Get all subjects with formatted data"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, progress, last_message_at, icon, created_at 
            FROM subjects 
            ORDER BY last_message_at DESC, created_at DESC
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
    finally:
        conn.close()

def get_subject_by_id(subject_id: int) -> Optional[Dict]:
    """Get a single subject by ID"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, name, progress, last_message_at, icon FROM subjects WHERE id = ?",
            (subject_id,)
        )
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
    finally:
        conn.close()

def update_subject_progress(subject_id: int, progress: int, update_timestamp: bool = True) -> Optional[Dict]:
    """Update subject progress and optionally last_message_at"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        if update_timestamp:
            cursor.execute(
                "UPDATE subjects SET progress = ?, last_message_at = ? WHERE id = ?",
                (progress, datetime.now().isoformat(), subject_id)
            )
        else:
            cursor.execute(
                "UPDATE subjects SET progress = ? WHERE id = ?",
                (progress, subject_id)
            )
        
        conn.commit()
        
        if cursor.rowcount == 0:
            return None
        
        return get_subject_by_id(subject_id)
    finally:
        conn.close()

def update_subject_last_message(subject_id: int) -> Optional[Dict]:
    """Update only the last_message_at timestamp"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE subjects SET last_message_at = ? WHERE id = ?",
            (datetime.now().isoformat(), subject_id)
        )
        conn.commit()
        
        if cursor.rowcount == 0:
            return None
        
        return get_subject_by_id(subject_id)
    finally:
        conn.close()

def delete_subject(subject_id: int) -> bool:
    """Delete a subject"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM subjects WHERE id = ?", (subject_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()