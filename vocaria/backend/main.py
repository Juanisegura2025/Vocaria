from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, insert, text
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional, List
import os
import sys
import hashlib
from datetime import datetime
from dotenv import load_dotenv

# Agregar src al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Intentar importar los modelos
try:
    from models import User, Conversation, Message
    MODELS_AVAILABLE = True
    print("✅ Models imported successfully")
except ImportError as e:
    print(f"⚠️ Models import failed: {e}")
    MODELS_AVAILABLE = False

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./vocaria.db")
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Vocaria API starting up...")
    yield
    print("🛑 Vocaria API shutting down...")
    await engine.dispose()

# Modelos Pydantic
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool

app = FastAPI(
    title="Vocaria API",
    version="1.0.0",
    description="API completa para el asistente de voz Vocaria",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "🎤 Vocaria API - Funcionando!",
        "version": "1.0.0",
        "status": "✅ Ready",
        "models_loaded": MODELS_AVAILABLE,
        "endpoints": [
            "GET /health - Estado del sistema",
            "GET / - Este endpoint"
        ]
    }

@app.get("/health")
async def health_check():
    try:
        return {
            "status": "✅ healthy",
            "database": "🗄️ available" if DATABASE_URL else "❌ not configured",
            "models": "✅ loaded" if MODELS_AVAILABLE else "⚠️ not loaded",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "⚠️ limited", 
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Vocaria API server...")
    uvicorn.run(app, host="0.0.0.0", port=8001)