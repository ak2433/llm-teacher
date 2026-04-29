# Quiz authoring + grading (adapted from 10_syllabus_quiz_agents/agents.py)

from __future__ import annotations

import json
import re

import ollama

from llm_prompts import ROLE_QUIZ_AUTHOR
from syllabus_rag import parse_markdown_sections

QUIZ_PASS_THRESHOLD = 75.0


def eligible_quiz_sections(syllabus_text: str) -> list[dict[str, str]]:
    """Sections long enough for MCQs; mirrors demo's skip-if-body-too-short."""
    sections = parse_markdown_sections(syllabus_text)
    long_enough = [s for s in sections if len((s.get("body") or "").strip()) >= 50]
    if long_enough:
        return long_enough
    with_body = [s for s in sections if (s.get("body") or "").strip()]
    if with_body:
        return with_body
    return sections


def extract_json_object(text: str) -> dict:
    text = text.strip()
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    blob = m.group(1) if m else None
    if not blob:
        start, end = text.find("{"), text.rfind("}")
        if start >= 0 and end > start:
            blob = text[start : end + 1]
    if not blob:
        raise ValueError("Model did not return JSON.")
    return json.loads(blob)


def strip_quiz_for_client(quiz: dict) -> dict:
    questions = []
    for q in quiz.get("questions") or []:
        questions.append({"question": q["question"], "choices": q["choices"]})
    return {
        "section_id": quiz.get("section_id"),
        "title": quiz.get("title"),
        "questions": questions,
    }


def grade_quiz(quiz: dict, answers: list[int]) -> tuple[float, int, int]:
    questions = quiz.get("questions") or []
    n = len(questions)
    if n == 0:
        return 0.0, 0, 0
    if len(answers) != n:
        raise ValueError(f"Expected {n} answers, got {len(answers)}")
    correct = sum(
        1
        for i, q in enumerate(questions)
        if int(answers[i]) == int(q.get("correct_index", -1))
    )
    pct = 100.0 * correct / n
    return pct, correct, n


def generate_quiz_for_section(section: dict[str, str], model: str) -> dict:
    body = section.get("body") or ""
    task = (
        f"Section id: {section['id']}\n"
        f"Section title: {section['title']}\n\n"
        f"Content:\n{body[:7000]}\n\n"
        f"Write the JSON quiz for this section only. section_id must be '{section['id']}'."
    )
    response = ollama.chat(
        model=model,
        messages=[
            {"role": "system", "content": ROLE_QUIZ_AUTHOR},
            {"role": "user", "content": task},
        ],
        options={"num_predict": 1024},
    )
    raw = (response.get("message") or {}).get("content") or ""
    quiz = extract_json_object(raw)
    quiz["section_id"] = section["id"]
    quiz["title"] = quiz.get("title") or section["title"]
    qs = quiz.get("questions") or []
    if not isinstance(qs, list) or len(qs) == 0:
        raise ValueError("Generated quiz has no questions.")
    return quiz


def find_quiz_for_section(quizzes: list[dict], section_id: str) -> dict | None:
    return next((q for q in quizzes if q.get("section_id") == section_id), None)


def upsert_quiz(quizzes: list[dict], quiz: dict) -> list[dict]:
    sid = quiz.get("section_id")
    rest = [q for q in quizzes if q.get("section_id") != sid]
    rest.append(quiz)
    return rest
