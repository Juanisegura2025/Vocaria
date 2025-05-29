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
from models import User, Conversation, Message

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

class ConversationCreate(BaseModel):
    title: Optional[str] = "Nueva conversación"

class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime

class MessageCreate(BaseModel):
    content: str
    is_user: bool = True

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    content: str
    is_user: bool
    created_at: datetime

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

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@app.get("/")
async def root():
    return {
        "message": "🎤 Vocaria API - Completamente funcional!",
        "version": "1.0.0",
        "status": "✅ Ready",
        "endpoints": [
            "GET /health - Estado del sistema",
            "POST /api/users/register - Registrar usuario",
            "GET /api/users - Listar usuarios",
            "POST /api/conversations - Crear conversación",
            "GET /api/conversations - Listar conversaciones",
            "POST /api/conversations/{id}/messages - Enviar mensaje",
            "GET /api/conversations/{id}/messages - Obtener mensajes"
        ]
    }

@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        # Contar registros usando ORM
        users = await db.execute(select(User))
        user_count = len(users.all())
        
        conversations = await db.execute(select(Conversation))
        conversation_count = len(conversations.all())
        
        messages = await db.execute(select(Message))
        message_count = len(messages.all())
        
        return {
            "status": "✅ healthy",
            "database": "🗄️ connected",
            "stats": {
                "users": user_count,
                "conversations": conversation_count,
                "messages": message_count
            }
        }
    except Exception as e:
        return {"status": "⚠️ limited", "error": str(e)}

# ========== USUARIOS ==========
@app.post("/api/users/register", response_model=UserResponse)
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Verificar si el usuario ya existe
        existing = await db.execute(
            select(User).where((User.username == user.username) | (User.email == user.email))
        )
        if existing.first():
            raise HTTPException(status_code=400, detail="Usuario o email ya existe")
        
        # Crear nuevo usuario
        new_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hash_password(user.password),
            is_active=True
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        return UserResponse(
            id=new_user.id,
            username=new_user.username,
            email=new_user.email,
            is_active=new_user.is_active
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear usuario: {str(e)}")

@app.get("/api/users", response_model=List[UserResponse])
async def get_users(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        return [
            UserResponse(
                id=user.id,
                username=user.username,
                email=user.email,
                is_active=user.is_active
            ) for user in users
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== CONVERSACIONES ==========
@app.post("/api/conversations", response_model=ConversationResponse)
async def create_conversation(conversation: ConversationCreate, db: AsyncSession = Depends(get_db)):
    try:
        new_conversation = Conversation(
            title=conversation.title,
            user_id=1  # Por simplicidad, usar usuario ID 1
        )
        
        db.add(new_conversation)
        await db.commit()
        await db.refresh(new_conversation)
        
        return ConversationResponse(
            id=new_conversation.id,
            title=new_conversation.title,
            created_at=new_conversation.created_at
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear conversación: {str(e)}")

@app.get("/api/conversations", response_model=List[ConversationResponse])
async def get_conversations(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Conversation))
        conversations = result.scalars().all()
        
        return [
            ConversationResponse(
                id=conv.id,
                title=conv.title,
                created_at=conv.created_at
            ) for conv in conversations
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== MENSAJES ==========
@app.post("/api/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(conversation_id: int, message: MessageCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Verificar que la conversación existe
        conv_result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
        if not conv_result.first():
            raise HTTPException(status_code=404, detail="Conversación no encontrada")
        
        new_message = Message(
            conversation_id=conversation_id,
            content=message.content,
            is_user=message.is_user
        )
        
        db.add(new_message)
        await db.commit()
        await db.refresh(new_message)
        
        return MessageResponse(
            id=new_message.id,
            conversation_id=new_message.conversation_id,
            content=new_message.content,
            is_user=new_message.is_user,
            created_at=new_message.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al enviar mensaje: {str(e)}")

@app.get("/api/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(conversation_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(Message).where(Message.conversation_id == conversation_id)
        )
        messages = result.scalars().all()
        
        return [
            MessageResponse(
                id=msg.id,
                conversation_id=msg.conversation_id,
                content=msg.content,
                is_user=msg.is_user,
                created_at=msg.created_at
            ) for msg in messages
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
