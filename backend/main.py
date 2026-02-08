from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama
from typing import List, Dict

app = FastAPI()

# Enable CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: str = "llama3.1:8b"

class ChatResponse(BaseModel):
    message: str
    model: str

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Convert messages to Ollama format
        ollama_messages = [
            {"role": msg.role, "content": msg.content} 
            for msg in request.messages
        ]
        
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