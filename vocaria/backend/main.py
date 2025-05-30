from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, insert, text
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
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
# Modelos Pydantic para requests/responses
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: Optional[datetime] = None

class ConversationCreate(BaseModel):
    user_id: int
    title: str

class ConversationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: Optional[datetime] = None

class MessageCreate(BaseModel):
    conversation_id: int
    content: str
    is_user: bool = True

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    content: str
    is_user: bool
    created_at: Optional[datetime] = None

# Helper function para hash passwords
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# ENDPOINTS DE USUARIOS
@app.get("/api/users", response_model=List[UserResponse])
async def get_users(db: AsyncSession = Depends(get_db)):
    if not MODELS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Models not available")
    
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users

@app.post("/api/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    if not MODELS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Models not available")
    
    # Verificar si el usuario ya existe
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Crear nuevo usuario
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        is_active=True
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    if not MODELS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Models not available")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ENDPOINTS DE CONVERSACIONES
@app.get("/api/conversations", response_model=List[ConversationResponse])
async def get_conversations(db: AsyncSession = Depends(get_db)):
    if not MODELS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Models not available")
    
    result = await db.execute(select(Conversation))
    conversations = result.scalars().all()
    return conversations

@app.post("/api/conversations", response_model=ConversationResponse)
async def create_conversation(conversation: ConversationCreate, db: AsyncSession = Depends(get_db)):
    if not MODELS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Models not available")
    
    # Verificar que el usuario existe
    result = await db.execute(select(User).where(User.id == conversation.user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")
    
    # Crear conversación
    db_conversation = Conversation(
        user_id=conversation.user_id,
        title=conversation.title
    )
    db.add(db_conversation)
    await db.commit()
    await db.refresh(db_conversation)
    return db_conversation

@app.get("/api/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: int, db: AsyncSession = Depends(get_db)):
    if not MODELS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Models not available")
    
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

# ENDPOINTS DE MENSAJES
@app.get("/api/messages", response_model=List[MessageResponse])
async def get_messages(conversation_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    if not MODELS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Models not available")
    
    query = select(Message)
    if conversation_id:
        query = query.where(Message.conversation_id == conversation_id)
    
    result = await db.execute(query)
    messages = result.scalars().all()
    return messages

@app.post("/api/messages", response_model=MessageResponse)
async def create_message(message: MessageCreate, db: AsyncSession = Depends(get_db)):
    if not MODELS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Models not available")
    
    # Verificar que la conversación existe
    result = await db.execute(select(Conversation).where(Conversation.id == message.conversation_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Crear mensaje
    db_message = Message(
        conversation_id=message.conversation_id,
        content=message.content,
        is_user=message.is_user
    )
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    return db_message

@app.get("/api/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(conversation_id: int, db: AsyncSession = Depends(get_db)):
    if not MODELS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Models not available")
    
    # Verificar que la conversación existe
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Obtener mensajes
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    return messages
