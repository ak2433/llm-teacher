from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import ollama
import json
import os
from typing import List, Optional
from contextlib import asynccontextmanager

from database import (
    init_db,
    create_subject,
    get_all_subjects,
    get_subject_by_id,
    get_subject_by_name,
    update_subject_progress,
    update_subject_last_message,
    delete_subject,
    save_curriculum,
    get_curriculum_by_subject,
    save_document,
    save_chat_message,
    get_chat_messages_by_subject,
    update_subject_quiz_progress,
)
from file_parser import parse_file
from llm_prompts import (
    FILE_BASED_CURRICULUM_PROMPT,
    INITIALIZING_PROMPT,
    ROLE_CONTENT_TUTOR,
    SYSTEM_PROMPTS,
)
from syllabus_rag import (
    format_course_outline,
    parse_markdown_sections,
    search_sections,
    sections_context_for_llm,
)
from syllabus_storage import (
    delete_syllabus_dir,
    write_syllabus_markdown,
    read_syllabus_markdown_file,
    load_quizzes_json,
    save_quizzes_json,
)
from quiz_agents import (
    QUIZ_PASS_THRESHOLD,
    eligible_quiz_sections,
    find_quiz_for_section,
    generate_quiz_for_section,
    grade_quiz,
    strip_quiz_for_client,
    upsert_quiz,
)


def get_syllabus_text(subject_id: int) -> Optional[str]:
    file_text = read_syllabus_markdown_file(subject_id)
    if file_text and file_text.strip():
        return file_text
    cur = get_curriculum_by_subject(subject_id)
    if cur and (cur.get("content") or "").strip():
        return cur["content"]
    return None


def default_ollama_model() -> str:
    return os.environ.get("OLLAMA_MODEL", "llama3.1:8b")


# Initialize database on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    init_db()
    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)

# Enable CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Models ====================

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = None  # falls back to OLLAMA_MODEL env or llama3.1:8b
    subject: Optional[str] = None
    subject_id: Optional[int] = None
    is_new_subject: Optional[bool] = False

class ChatResponse(BaseModel):
    message: str
    model: str

class SubjectCreate(BaseModel):
    name: str
    icon: Optional[str] = "📚"
    additional_context: Optional[str] = None

class SubjectUpdate(BaseModel):
    progress: Optional[int] = None
    update_timestamp: Optional[bool] = True

class SubjectResponse(BaseModel):
    id: int
    name: str
    progress: int
    lastMessage: str
    icon: str
    is_new_subject: Optional[bool] = False
    next_section_index: Optional[int] = None


class QuizSubmit(BaseModel):
    section_id: str
    answers: List[int]

# ==================== Chat Endpoint ====================

def _build_ollama_messages(
    request: ChatRequest,
) -> tuple[List[dict], bool]:
    """
    Returns (ollama message list, save_as_curriculum for streamed legacy init path only).
    """
    subject = request.subject or "default"
    subject_id = request.subject_id
    syllabus = get_syllabus_text(subject_id) if subject_id else None
    has_syllabus = bool(syllabus and syllabus.strip())
    is_first = bool(request.is_new_subject and len(request.messages) == 1)
    legacy_init = is_first and subject_id is not None and not has_syllabus
    use_tutor = bool(subject_id and has_syllabus and not legacy_init)

    if legacy_init:
        ollama_messages: List[dict] = [{"role": "system", "content": INITIALIZING_PROMPT}]
        ollama_messages.extend(
            {"role": m.role, "content": m.content} for m in request.messages
        )
        return ollama_messages, True

    if use_tutor and syllabus is not None:
        sections = parse_markdown_sections(syllabus)
        ollama_messages = [{"role": "system", "content": ROLE_CONTENT_TUTOR}]
        msgs: List[dict] = [{"role": m.role, "content": m.content} for m in request.messages]
        if msgs and msgs[-1]["role"] == "user":
            q = msgs[-1]["content"]
            outline = format_course_outline(sections)
            chunks = search_sections(q, sections, top_k=5)
            related = sections_context_for_llm(chunks)
            msgs[-1]["content"] = (
                "## Course map (from syllabus — full outline)\n"
                f"{outline}\n\n"
                "## Related syllabus excerpts (hints for this question)\n"
                f"{related}\n\n"
                "---\n\n"
                f"Student question:\n{q}"
            )
        ollama_messages.extend(msgs)
        return ollama_messages, False

    system_prompt = SYSTEM_PROMPTS.get(subject.lower(), SYSTEM_PROMPTS["default"])
    ollama_messages = [{"role": "system", "content": system_prompt}]
    ollama_messages.extend(
        {"role": m.role, "content": m.content} for m in request.messages
    )
    return ollama_messages, False


@app.post("/chat")
async def chat(request: ChatRequest):
    if request.subject_id:
        update_subject_last_message(request.subject_id)

    ollama_messages, save_as_curriculum = _build_ollama_messages(request)
    subject_id_for_save = request.subject_id
    model_name = request.model or default_ollama_model()

    def generate():
        full_response = ""
        try:
            stream = ollama.chat(
                model=model_name,
                messages=ollama_messages,
                stream=True,
            )
            for chunk in stream:
                token = chunk["message"]["content"]
                full_response += token
                yield json.dumps({"token": token}) + "\n"

            if save_as_curriculum and full_response and subject_id_for_save:
                save_curriculum(subject_id_for_save, full_response)
                write_syllabus_markdown(subject_id_for_save, full_response)

            if subject_id_for_save and request.messages and full_response:
                last_user = request.messages[-1]
                save_chat_message(subject_id_for_save, "user", last_user.content)
                save_chat_message(subject_id_for_save, "assistant", full_response)

        except Exception as e:
            yield json.dumps({"error": str(e)}) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")

# ==================== Subject Endpoints ====================

@app.get("/subjects", response_model=List[SubjectResponse])
async def list_subjects():
    """Get all subjects for the profile screen"""
    try:
        subjects = get_all_subjects()
        return subjects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/subjects", response_model=SubjectResponse)
async def add_subject(subject: SubjectCreate):
    """Create a new subject, generate syllabus (markdown) via Ollama, rejecting duplicates with 409."""
    try:
        existing = get_subject_by_name(subject.name)
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Subject '{existing['name']}' already exists.",
            )
        new_subject = create_subject(subject.name, subject.icon)
        user_topic = subject.name.strip() or "this topic"
        user_content = f"I want to learn about: {user_topic}"
        if subject.additional_context and subject.additional_context.strip():
            user_content += (
                "\n\nAdditional context or lens for this course:\n"
                f"{subject.additional_context.strip()}"
            )
        try:
            response = ollama.chat(
                model=default_ollama_model(),
                messages=[
                    {"role": "system", "content": INITIALIZING_PROMPT},
                    {"role": "user", "content": user_content},
                ],
            )
            curriculum_text = (response.get("message") or {}).get("content") or ""
            if not str(curriculum_text).strip():
                raise ValueError("Model returned an empty curriculum.")
            save_curriculum(new_subject["id"], curriculum_text)
            write_syllabus_markdown(new_subject["id"], curriculum_text)
        except Exception as e:
            delete_subject(new_subject["id"])
            delete_syllabus_dir(new_subject["id"])
            raise HTTPException(
                status_code=500,
                detail=f"Could not generate syllabus: {e!s}",
            ) from e
        new_subject["is_new_subject"] = True
        return new_subject
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/subjects/{subject_id}", response_model=SubjectResponse)
async def get_subject(subject_id: int):
    """Get a specific subject by ID"""
    subject = get_subject_by_id(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

@app.get("/subjects/{subject_id}/messages")
async def get_subject_messages(subject_id: int, limit: int = 4):
    """Get the last N messages for a subject (default 4 = last 2 user+assistant interactions)"""
    subject = get_subject_by_id(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    messages = get_chat_messages_by_subject(subject_id, limit=limit)
    return {"messages": messages}


@app.get("/subjects/{subject_id}/syllabus/outline")
async def get_syllabus_outline(subject_id: int):
    """Raw markdown from ``syllabus.md`` on disk only (``data/syllabi/{id}/syllabus.md``)."""
    subject = get_subject_by_id(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    text = read_syllabus_markdown_file(subject_id)
    if not text or not text.strip():
        raise HTTPException(
            status_code=404,
            detail="No syllabus markdown file found for this subject.",
        )
    return {"course_title": subject["name"], "markdown": text}


@app.patch("/subjects/{subject_id}", response_model=SubjectResponse)
async def update_subject(subject_id: int, update: SubjectUpdate):
    """Update subject progress"""
    try:
        if update.progress is not None:
            updated_subject = update_subject_progress(
                subject_id,
                update.progress,
                update.update_timestamp if update.update_timestamp is not None else True
            )
        else:
            updated_subject = update_subject_last_message(subject_id)

        if not updated_subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        return updated_subject
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/subjects/{subject_id}")
async def remove_subject(subject_id: int):
    """Delete a subject"""
    success = delete_subject(subject_id)
    if not success:
        raise HTTPException(status_code=404, detail="Subject not found")
    delete_syllabus_dir(subject_id)
    return {"message": "Subject deleted successfully"}

# ==================== File Upload Endpoint ====================

@app.post("/subjects/upload", response_model=SubjectResponse)
async def upload_subject(file: UploadFile = File(...), name: Optional[str] = None):
    """Create a new subject from an uploaded document (PDF, TXT, DOCX)."""
    try:
        file_bytes = await file.read()
        content = parse_file(file.filename, file_bytes)

        if not content.strip():
            raise HTTPException(status_code=400, detail="The uploaded file appears to be empty.")

        subject_name = name or file.filename.rsplit(".", 1)[0]
        new_subject = create_subject(subject_name)

        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "unknown"
        save_document(new_subject["id"], file.filename, content, ext)

        prompt = FILE_BASED_CURRICULUM_PROMPT.format(
            document_content=content[:8000]
        )
        response = ollama.chat(
            model=default_ollama_model(),
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Create a study curriculum for: {subject_name}"},
            ],
        )
        curriculum_text = response["message"]["content"]

        save_curriculum(new_subject["id"], curriculum_text)
        write_syllabus_markdown(new_subject["id"], curriculum_text)

        new_subject["is_new_subject"] = True
        return new_subject
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/subjects/{subject_id}/quiz/current")
async def get_current_quiz(subject_id: int):
    """Quiz for the syllabus section at next_section_index (generated once per section, cached)."""
    sub = get_subject_by_id(subject_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")
    syllabus = get_syllabus_text(subject_id)
    if not syllabus or not syllabus.strip():
        raise HTTPException(status_code=400, detail="No syllabus for this subject.")
    sections = eligible_quiz_sections(syllabus)
    n = len(sections)
    if n == 0:
        raise HTTPException(status_code=400, detail="Could not derive syllabus sections.")
    idx = int(sub.get("next_section_index") or 0)
    if idx >= n:
        return {
            "completed": True,
            "progress_percent": sub["progress"],
            "total_sections": n,
            "next_section_index": idx,
            "message": "You've completed all sections.",
        }
    sec = sections[idx]
    quizzes = load_quizzes_json(subject_id)
    quiz = find_quiz_for_section(quizzes, sec["id"])
    if quiz is None:
        try:
            quiz = generate_quiz_for_section(sec, default_ollama_model())
            quizzes = upsert_quiz(quizzes, quiz)
            save_quizzes_json(subject_id, quizzes)
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Could not generate quiz: {e!s}") from e
    client_quiz = strip_quiz_for_client(quiz)
    return {
        "completed": False,
        "total_sections": n,
        "section_index": idx,
        "progress_percent": sub["progress"],
        "quiz": client_quiz,
    }


@app.post("/subjects/{subject_id}/quiz/submit")
async def submit_section_quiz(subject_id: int, body: QuizSubmit):
    """Grade quiz; if score is strictly greater than 75%, advance section cursor and progress bar."""
    sub = get_subject_by_id(subject_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")
    syllabus = get_syllabus_text(subject_id)
    if not syllabus or not syllabus.strip():
        raise HTTPException(status_code=400, detail="No syllabus for this subject.")
    sections = eligible_quiz_sections(syllabus)
    n = len(sections)
    if n == 0:
        raise HTTPException(status_code=400, detail="Could not derive syllabus sections.")
    idx = int(sub.get("next_section_index") or 0)
    if idx >= n:
        raise HTTPException(status_code=400, detail="There is no active quiz.")
    sec = sections[idx]
    if body.section_id != sec["id"]:
        raise HTTPException(status_code=400, detail="Quiz does not match the current section.")

    quizzes = load_quizzes_json(subject_id)
    quiz = find_quiz_for_section(quizzes, sec["id"])
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found. Open Quiz again.")

    try:
        pct, correct, total = grade_quiz(quiz, body.answers)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    advanced = False
    if pct > QUIZ_PASS_THRESHOLD:
        new_idx = idx + 1
        new_progress = min(100, int(100 * new_idx / n))
        updated = update_subject_quiz_progress(subject_id, new_idx, new_progress)
        advanced = updated is not None
        sub = get_subject_by_id(subject_id) or sub

    course_completed = False
    if advanced and sub:
        course_completed = int(sub.get("next_section_index") or 0) >= n

    return {
        "score_percent": round(pct, 2),
        "correct_count": correct,
        "total_questions": total,
        "passed": pct > QUIZ_PASS_THRESHOLD,
        "advanced_section": advanced,
        "progress_percent": sub["progress"],
        "next_section_index": int(sub.get("next_section_index") or idx),
        "course_completed": course_completed,
        "total_sections": n,
    }


# ==================== Other Endpoints ====================

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/models")
async def list_models():
    try:
        models = ollama.list()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    init_db()
    uvicorn.run(app, host="0.0.0.0", port=8000)
