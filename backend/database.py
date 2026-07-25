# database.py — PostgreSQL via psycopg
from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import psycopg
from psycopg.rows import dict_row

# Default matches docker-compose.yml in this repo
DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/llm_teacher"


def _load_dotenv() -> None:
    """Load backend/.env into os.environ if present (does not override existing vars)."""
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_dotenv()


def database_url() -> str:
    return os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL).strip()


def get_db_connection():
    """Open a Postgres connection with dict-like rows."""
    conn = psycopg.connect(database_url(), row_factory=dict_row)
    return conn


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def init_db():
    """Create tables if they do not exist."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS subjects (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    progress INTEGER DEFAULT 0,
                    last_message_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    icon TEXT DEFAULT '📚',
                    next_section_index INTEGER NOT NULL DEFAULT 0
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS curricula (
                    id SERIAL PRIMARY KEY,
                    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id SERIAL PRIMARY KEY,
                    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                    filename TEXT NOT NULL,
                    content TEXT NOT NULL,
                    file_type TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id SERIAL PRIMARY KEY,
                    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            cursor.execute("""
                ALTER TABLE subjects
                ADD COLUMN IF NOT EXISTS next_section_index INTEGER NOT NULL DEFAULT 0
            """)
        conn.commit()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization failed: {e}")
        raise
    finally:
        conn.close()


def get_time_ago(timestamp: Any) -> str:
    """Convert timestamp to human-readable 'time ago' format."""
    if not timestamp:
        return "Never"

    try:
        if isinstance(timestamp, datetime):
            dt = timestamp
        else:
            dt = datetime.fromisoformat(str(timestamp).replace("Z", "+00:00"))

        if dt.tzinfo is not None:
            now = datetime.now(timezone.utc)
            dt = dt.astimezone(timezone.utc)
        else:
            now = datetime.now()

        seconds = (now - dt).total_seconds()

        if seconds < 60:
            return "Just now"
        if seconds < 3600:
            minutes = int(seconds / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        if seconds < 86400:
            hours = int(seconds / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        if seconds < 604800:
            days = int(seconds / 86400)
            return f"{days} day{'s' if days != 1 else ''} ago"
        if seconds < 2592000:
            weeks = int(seconds / 604800)
            return f"{weeks} week{'s' if weeks != 1 else ''} ago"
        months = int(seconds / 2592000)
        return f"{months} month{'s' if months != 1 else ''} ago"
    except Exception:
        return "Unknown"


def _subject_dict(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "progress": row["progress"],
        "lastMessage": f"Last session {get_time_ago(row['last_message_at'])}",
        "icon": row["icon"] or "📚",
        "next_section_index": row.get("next_section_index") or 0,
    }


# CRUD Operations

def create_subject(name: str, icon: str = "📚") -> Dict:
    """Create a new subject"""
    conn = get_db_connection()
    name = name.strip().lower()
    if name == "":
        name = "default"
        icon = "📚"
    if icon == "":
        icon = "📚"

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO subjects (name, icon, last_message_at)
                VALUES (%s, %s, %s)
                RETURNING id
                """,
                (name, icon, _utcnow()),
            )
            subject_id = cursor.fetchone()["id"]
        conn.commit()

        return {
            "id": subject_id,
            "name": name,
            "progress": 0,
            "icon": icon,
            "lastMessage": "Just now",
            "next_section_index": 0,
        }
    finally:
        conn.close()


def get_subject_by_name(name: str) -> Optional[Dict]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, progress, last_message_at, icon,
                       COALESCE(next_section_index, 0) AS next_section_index
                FROM subjects
                WHERE LOWER(name) = LOWER(%s)
                """,
                (name,),
            )
            row = cursor.fetchone()
            return _subject_dict(row) if row else None
    finally:
        conn.close()


def get_all_subjects() -> List[Dict]:
    """Get all subjects with formatted data"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, progress, last_message_at, icon, created_at,
                       COALESCE(next_section_index, 0) AS next_section_index
                FROM subjects
                ORDER BY last_message_at DESC NULLS LAST, created_at DESC
            """)
            return [_subject_dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def get_subject_by_id(subject_id: int) -> Optional[Dict]:
    """Get a single subject by ID"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, progress, last_message_at, icon,
                       COALESCE(next_section_index, 0) AS next_section_index
                FROM subjects
                WHERE id = %s
                """,
                (subject_id,),
            )
            row = cursor.fetchone()
            return _subject_dict(row) if row else None
    finally:
        conn.close()


def update_subject_quiz_progress(
    subject_id: int,
    next_section_index: int,
    progress_percent: int,
    update_timestamp: bool = True,
) -> Optional[Dict]:
    """Set quiz cursor and bar progress together (quiz pass path)."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            pct = max(0, min(100, progress_percent))
            if update_timestamp:
                cursor.execute(
                    """
                    UPDATE subjects
                    SET next_section_index = %s, progress = %s, last_message_at = %s
                    WHERE id = %s
                    """,
                    (next_section_index, pct, _utcnow(), subject_id),
                )
            else:
                cursor.execute(
                    """
                    UPDATE subjects
                    SET next_section_index = %s, progress = %s
                    WHERE id = %s
                    """,
                    (next_section_index, pct, subject_id),
                )
            updated = cursor.rowcount
        conn.commit()
        if updated == 0:
            return None
        return get_subject_by_id(subject_id)
    finally:
        conn.close()


def update_subject_progress(subject_id: int, progress: int, update_timestamp: bool = True) -> Optional[Dict]:
    """Update subject progress and optionally last_message_at"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if update_timestamp:
                cursor.execute(
                    """
                    UPDATE subjects
                    SET progress = %s, last_message_at = %s
                    WHERE id = %s
                    """,
                    (progress, _utcnow(), subject_id),
                )
            else:
                cursor.execute(
                    "UPDATE subjects SET progress = %s WHERE id = %s",
                    (progress, subject_id),
                )
            updated = cursor.rowcount
        conn.commit()
        if updated == 0:
            return None
        return get_subject_by_id(subject_id)
    finally:
        conn.close()


def update_subject_last_message(subject_id: int) -> Optional[Dict]:
    """Update only the last_message_at timestamp"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE subjects SET last_message_at = %s WHERE id = %s",
                (_utcnow(), subject_id),
            )
            updated = cursor.rowcount
        conn.commit()
        if updated == 0:
            return None
        return get_subject_by_id(subject_id)
    finally:
        conn.close()


def delete_subject(subject_id: int) -> bool:
    """Delete a subject"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM subjects WHERE id = %s", (subject_id,))
            deleted = cursor.rowcount
        conn.commit()
        return deleted > 0
    finally:
        conn.close()


# ==================== Curriculum CRUD ====================

def save_curriculum(subject_id: int, content: str) -> Dict:
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO curricula (subject_id, content)
                VALUES (%s, %s)
                RETURNING id
                """,
                (subject_id, content),
            )
            row_id = cursor.fetchone()["id"]
        conn.commit()
        return {
            "id": row_id,
            "subject_id": subject_id,
            "content": content,
        }
    finally:
        conn.close()


def get_curriculum_by_subject(subject_id: int) -> Optional[Dict]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, subject_id, content, created_at
                FROM curricula
                WHERE subject_id = %s
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (subject_id,),
            )
            row = cursor.fetchone()
            if row:
                return {
                    "id": row["id"],
                    "subject_id": row["subject_id"],
                    "content": row["content"],
                    "created_at": row["created_at"],
                }
            return None
    finally:
        conn.close()


# ==================== Document CRUD ====================

def save_document(subject_id: int, filename: str, content: str, file_type: str) -> Dict:
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO documents (subject_id, filename, content, file_type)
                VALUES (%s, %s, %s, %s)
                RETURNING id
                """,
                (subject_id, filename, content, file_type),
            )
            row_id = cursor.fetchone()["id"]
        conn.commit()
        return {
            "id": row_id,
            "subject_id": subject_id,
            "filename": filename,
            "file_type": file_type,
        }
    finally:
        conn.close()


def get_documents_by_subject(subject_id: int) -> List[Dict]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, subject_id, filename, content, file_type, created_at
                FROM documents
                WHERE subject_id = %s
                """,
                (subject_id,),
            )
            return [
                {
                    "id": row["id"],
                    "subject_id": row["subject_id"],
                    "filename": row["filename"],
                    "content": row["content"],
                    "file_type": row["file_type"],
                    "created_at": row["created_at"],
                }
                for row in cursor.fetchall()
            ]
    finally:
        conn.close()


# ==================== Chat Messages CRUD ====================

def save_chat_message(subject_id: int, role: str, content: str) -> Dict:
    """Save a single chat message (user or assistant)"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO chat_messages (subject_id, role, content)
                VALUES (%s, %s, %s)
                RETURNING id
                """,
                (subject_id, role, content),
            )
            row_id = cursor.fetchone()["id"]
        conn.commit()
        return {
            "id": row_id,
            "subject_id": subject_id,
            "role": role,
            "content": content,
        }
    finally:
        conn.close()


def get_chat_messages_by_subject(subject_id: int, limit: int = 4) -> List[Dict]:
    """Get the last N messages for a subject (chronological order). Default 4 = last 2 interactions."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, subject_id, role, content, created_at
                FROM chat_messages
                WHERE subject_id = %s
                ORDER BY id DESC
                LIMIT %s
                """,
                (subject_id, limit),
            )
            rows = list(reversed(cursor.fetchall()))
            return [
                {
                    "id": row["id"],
                    "subject_id": row["subject_id"],
                    "role": row["role"],
                    "content": row["content"],
                    "created_at": row["created_at"],
                }
                for row in rows
            ]
    finally:
        conn.close()
