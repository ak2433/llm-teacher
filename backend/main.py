from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import ollama
import json
import llm_prompts
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
)
from file_parser import parse_file, SUPPORTED_EXTENSIONS

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
    model: str = "llama3.1:8b"
    subject: Optional[str] = None
    subject_id: Optional[int] = None
    is_new_subject: Optional[bool] = False

class ChatResponse(BaseModel):
    message: str
    model: str

class SubjectCreate(BaseModel):
    name: str
    icon: Optional[str] = "📚"

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

# ==================== Chat Endpoint ====================

@app.post("/chat")
async def chat(request: ChatRequest):
    if request.subject_id:
        update_subject_last_message(request.subject_id)

    subject = request.subject or "default"
    is_first_message = request.is_new_subject and len(request.messages) == 1

    if is_first_message:
        system_prompt = llm_prompts.INITIALIZING_PROMPT
    else:
        system_prompt = llm_prompts.SYSTEM_PROMPTS.get(subject.lower(), llm_prompts.SYSTEM_PROMPTS["default"])

    ollama_messages = [{"role": "system", "content": system_prompt}]
    ollama_messages.extend([
        {"role": msg.role, "content": msg.content}
        for msg in request.messages
    ])

    save_as_curriculum = is_first_message and request.subject_id is not None
    subject_id_for_save = request.subject_id

    def generate():
        full_response = ""
        try:
            stream = ollama.chat(
                model=request.model,
                messages=ollama_messages,
                stream=True,
            )
            for chunk in stream:
                token = chunk["message"]["content"]
                full_response += token
                yield json.dumps({"token": token}) + "\n"

            if subject_id_for_save:
                subj = get_subject_by_id(subject_id_for_save)
                if subj:
                    new_progress = min(subj["progress"] + 5, 100)
                    update_subject_progress(subject_id_for_save, new_progress)

            if save_as_curriculum and full_response:
                save_curriculum(subject_id_for_save, full_response)

            # Save chat messages for history (last 2 interactions)
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
    """Create a new subject, rejecting duplicates with 409."""
    try:
        existing = get_subject_by_name(subject.name)
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Subject '{existing['name']}' already exists.",
            )
        new_subject = create_subject(subject.name, subject.icon)
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

        prompt = llm_prompts.FILE_BASED_CURRICULUM_PROMPT.format(
            document_content=content[:8000]
        )
        response = ollama.chat(
            model="llama3.1:8b",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Create a study curriculum for: {subject_name}"},
            ],
        )
        curriculum_text = response["message"]["content"]

        save_curriculum(new_subject["id"], curriculum_text)

        new_subject["is_new_subject"] = True
        return new_subject
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
