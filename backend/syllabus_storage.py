# Per-subject syllabus.json + quizzes.json on disk

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_data_root = Path(__file__).resolve().parent / "data" / "syllabi"


def syllabus_path(subject_id: int) -> Path:
    return _data_root / str(subject_id) / "syllabus.json"


def ensure_syllabus_dir(subject_id: int) -> Path:
    p = syllabus_path(subject_id)
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def write_syllabus_json(subject_id: int, syllabus: dict[str, Any]) -> None:
    path = ensure_syllabus_dir(subject_id)
    path.write_text(json.dumps(syllabus, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def read_syllabus_json(subject_id: int) -> dict[str, Any] | None:
    path = syllabus_path(subject_id)
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def quizzes_json_path(subject_id: int) -> Path:
    return _data_root / str(subject_id) / "quizzes.json"


def load_quizzes_json(subject_id: int) -> list[dict]:
    path = quizzes_json_path(subject_id)
    if not path.is_file():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def save_quizzes_json(subject_id: int, quizzes: list[dict]) -> None:
    ensure_syllabus_dir(subject_id)
    path = quizzes_json_path(subject_id)
    path.write_text(json.dumps(quizzes, indent=2), encoding="utf-8")


def delete_syllabus_dir(subject_id: int) -> None:
    d = _data_root / str(subject_id)
    if d.is_dir():
        for child in sorted(d.rglob("*"), reverse=True):
            if child.is_file():
                child.unlink()
        try:
            d.rmdir()
        except OSError:
            pass
