# JSON syllabus shape + helpers (course map for tutor / quizzes / outline UI)

from __future__ import annotations

import json
import re
from typing import Any


def extract_json_payload(text: str) -> dict:
    """Parse a JSON object from model output (raw or fenced)."""
    text = (text or "").strip()
    if not text:
        raise ValueError("Empty syllabus response.")

    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    blob = m.group(1) if m else None
    if not blob:
        start, end = text.find("{"), text.rfind("}")
        if start >= 0 and end > start:
            blob = text[start : end + 1]
    if not blob:
        raise ValueError("Model did not return a JSON object.")
    data = json.loads(blob)
    if not isinstance(data, dict):
        raise ValueError("Syllabus JSON must be an object.")
    return data


def _as_str_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        s = value.strip()
        if not s or s.lower() == "none":
            return []
        return [s]
    if isinstance(value, list):
        out: list[str] = []
        for item in value:
            if item is None:
                continue
            s = str(item).strip()
            if s and s.lower() != "none":
                out.append(s)
        return out
    return [str(value).strip()] if str(value).strip() else []


def normalize_module(raw: Any, index: int) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ValueError(f"Module {index} is not an object.")
    title = str(raw.get("title") or f"Module {index}").strip()
    module_num = raw.get("module", index)
    try:
        module_num = int(module_num)
    except (TypeError, ValueError):
        module_num = index

    estimated = raw.get("estimated_length") or raw.get("estimatedLength") or ""
    estimated = str(estimated).strip() if estimated else ""

    return {
        "module": module_num,
        "title": title,
        "objectives": _as_str_list(raw.get("objectives")),
        "topics": _as_str_list(raw.get("topics")),
        "estimated_length": estimated or "45 minutes",
        "prerequisites": _as_str_list(raw.get("prerequisites")),
        "takeaways": _as_str_list(raw.get("takeaways")),
    }


def normalize_syllabus(data: dict, fallback_title: str = "") -> dict[str, Any]:
    """
    Canonical syllabus JSON:

    {
      "course_title": "History 101",
      "modules": [
        {
          "module": 1,
          "title": "Ancient Civilizations",
          "objectives": [...],
          "topics": [...],
          "estimated_length": "45 minutes",
          "prerequisites": [...],
          "takeaways": [...]
        }
      ]
    }
    """
    if "modules" in data and isinstance(data["modules"], list):
        modules_raw = data["modules"]
        course_title = str(data.get("course_title") or data.get("title") or fallback_title).strip()
    elif isinstance(data.get("module"), (int, str)) and data.get("title"):
        # Single module object from the model
        modules_raw = [data]
        course_title = fallback_title or str(data.get("course_title") or "").strip()
    else:
        raise ValueError("Syllabus JSON must include a 'modules' array.")

    modules = [normalize_module(m, i + 1) for i, m in enumerate(modules_raw)]
    if not modules:
        raise ValueError("Syllabus has no modules.")
    if not course_title:
        course_title = fallback_title or "Course"

    return {"course_title": course_title, "modules": modules}


def format_course_outline(syllabus: dict) -> str:
    """Compact course map text for the tutor system context."""
    lines: list[str] = [f"Course: {syllabus.get('course_title') or 'Course'}"]
    for m in syllabus.get("modules") or []:
        lines.append(f"\nModule {m.get('module')}: {m.get('title')}")
        objs = m.get("objectives") or []
        if objs:
            lines.append("  Objectives:")
            for o in objs:
                lines.append(f"    - {o}")
        topics = m.get("topics") or []
        if topics:
            lines.append("  Topics:")
            for i, t in enumerate(topics, 1):
                lines.append(f"    {i}. {t}")
        prereqs = m.get("prerequisites") or []
        lines.append(f"  Prerequisites: {', '.join(prereqs) if prereqs else 'None'}")
        if m.get("estimated_length"):
            lines.append(f"  Estimated length: {m['estimated_length']}")
        takeaways = m.get("takeaways") or []
        if takeaways:
            lines.append("  Takeaways:")
            for t in takeaways:
                lines.append(f"    - {t}")
    return "\n".join(lines).strip()


def modules_as_quiz_sections(syllabus: dict) -> list[dict[str, str]]:
    """Map each module to a quiz section {id, title, body}."""
    sections: list[dict[str, str]] = []
    for m in syllabus.get("modules") or []:
        mid = m.get("module", len(sections) + 1)
        sid = f"mod-{mid}"
        parts = [f"Module {mid}: {m.get('title', '')}"]
        objs = m.get("objectives") or []
        if objs:
            parts.append("Learning objectives:\n" + "\n".join(f"- {o}" for o in objs))
        topics = m.get("topics") or []
        if topics:
            parts.append("Topics:\n" + "\n".join(f"{i}. {t}" for i, t in enumerate(topics, 1)))
        takeaways = m.get("takeaways") or []
        if takeaways:
            parts.append("Takeaways:\n" + "\n".join(f"- {t}" for t in takeaways))
        body = "\n\n".join(parts).strip()
        sections.append({"id": sid, "title": str(m.get("title") or sid), "body": body})
    return sections


def syllabus_to_markdown(syllabus: dict) -> str:
    """Render syllabus JSON as a readable markdown outline for the syllabus page."""
    lines: list[str] = [f"# {syllabus.get('course_title') or 'Course'}", ""]
    for m in syllabus.get("modules") or []:
        lines.append(f"## Module {m.get('module')}: {m.get('title')}")
        lines.append("")
        lines.append("### Learning Objectives")
        lines.append("")
        objs = m.get("objectives") or []
        if objs:
            for o in objs:
                lines.append(f"- {o}")
        else:
            lines.append("- None")
        lines.append("")
        lines.append("### Topics")
        lines.append("")
        topics = m.get("topics") or []
        if topics:
            for i, t in enumerate(topics, 1):
                lines.append(f"{i}. {t}")
        else:
            lines.append("None")
        lines.append("")
        lines.append("### Estimated Length")
        lines.append("")
        lines.append(str(m.get("estimated_length") or "—"))
        lines.append("")
        lines.append("### Prerequisites")
        lines.append("")
        prereqs = m.get("prerequisites") or []
        lines.append(", ".join(prereqs) if prereqs else "None")
        lines.append("")
        takeaways = m.get("takeaways") or []
        if takeaways:
            lines.append("### Takeaways")
            lines.append("")
            for t in takeaways:
                lines.append(f"- {t}")
            lines.append("")
    return "\n".join(lines).strip() + "\n"
