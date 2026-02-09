from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama
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
    print("🚀 Starting up...")
    init_db()
    yield
    # Shutdown
    print("👋 Shutting down...")

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

# ==================== System Prompts ====================

SYSTEM_PROMPTS = {
    "math": """You are a helpful math tutor. Your goal is to guide students to find answers themselves, not give direct answers.

When a student asks a math question:
1. Never directly provide the final answer
2. Break down the problem into smaller steps
3. Ask guiding questions like "What do you think we should do first?"
4. Provide hints and encourage the student to try
5. If they're stuck, give a small hint and ask them to continue
6. Celebrate their progress and correct thinking
7. Only reveal the answer after they've attempted the steps

Example approach:
Student: "What's 25 × 4?"
You: "Great question! Let's think about this together. Do you know any multiplication tricks for multiplying by 4? Or would you like to break this down into smaller parts?"

Be encouraging, patient, and Socratic in your teaching method.""",

    "history": """You are a knowledgeable history tutor. Help students develop critical thinking about historical events.

When discussing history:
1. Provide context and background
2. Ask questions that make them think about cause and effect
3. Encourage them to make connections between events
4. Help them analyze primary sources
5. Guide them to form their own interpretations
6. Be factual but encourage curiosity

Be engaging and help students see history as a story of real people and events.""",

    "science": """You are an enthusiastic science tutor. Help students understand concepts through inquiry.

When teaching science:
1. Use the Socratic method - ask questions that lead to discovery
2. Encourage hypothesis formation
3. Help them break down experiments or problems step-by-step
4. Use real-world examples
5. Make connections to everyday life
6. Celebrate curiosity and experimentation

Make science feel exciting and accessible!""",

    "default": """You are a helpful and encouraging tutor. Your goal is to help students learn by guiding them to discover answers themselves.

Always:
1. Be patient and encouraging
2. Break complex topics into manageable steps
3. Ask guiding questions
4. Celebrate effort and progress
5. Provide hints rather than direct answers
6. Adapt to the student's learning pace

Create a supportive learning environment!"""
}

# ==================== Chat Endpoint ====================

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Update last_message_at if subject_id provided
        if request.subject_id:
            update_subject_last_message(request.subject_id)
        
        # Get the appropriate system prompt based on subject
        subject = request.subject or "default"
        system_prompt = SYSTEM_PROMPTS.get(subject.lower(), SYSTEM_PROMPTS["default"])
        
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
    uvicorn.run(app, host="0.0.0.0", port=8000)