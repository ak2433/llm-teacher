from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama
import llm_prompts
from typing import List, Optional
from contextlib import asynccontextmanager

# Import database functions
from database import (
    init_db, 
    create_subject, 
    get_all_subjects, 
    get_subject_by_id,
    update_subject_progress,
    update_subject_last_message,
    delete_subject
)

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
    subject_id: Optional[int] = None  # To update last_message_at

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

# ==================== Chat Endpoint ====================

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Update last_message_at if subject_id provided
        if request.subject_id:
            update_subject_last_message(request.subject_id)
        
        # Get the appropriate system prompt based on subject
        subject = request.subject or "default"
        system_prompt = llm_prompts.SYSTEM_PROMPTS.get(subject.lower(), llm_prompts.SYSTEM_PROMPTS["default"])
        
        # Convert messages to Ollama format and add system prompt
        ollama_messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        ollama_messages.extend([
            {"role": msg.role, "content": msg.content} 
            for msg in request.messages
        ])
        
        # Call Ollama
        response = ollama.chat(
            model=request.model,
            messages=ollama_messages
        )
        
        if request.subject_id: # Test: Update progress by 5 points
            subject = get_subject_by_id(request.subject_id)
            if subject:
                current_progress = subject["progress"]
                new_progress = min(current_progress + 5, 100)
                update_subject_progress(request.subject_id, new_progress)
                print(f"Progress updated: {current_progress} -> {new_progress} for subject {request.subject_id}")

        return ChatResponse(
            message=response['message']['content'],
            model=request.model
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    """Create a new subject"""
    try:
        new_subject = create_subject(subject.name, subject.icon)
        return new_subject
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/subjects/{subject_id}", response_model=SubjectResponse)
async def get_subject(subject_id: int):
    """Get a specific subject by ID"""
    subject = get_subject_by_id(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

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
            # Just update timestamp
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
    for i in range(10):
        delete_subject(i)
    create_subject("math", icon="📚")
    uvicorn.run(app, host="0.0.0.0", port=8000)