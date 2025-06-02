from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, text
from contextlib import asynccontextmanager
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import os
import sys
import hashlib
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import auth utilities
from src.vocaria.auth import (
    create_access_token,
    verify_password,
    get_password_hash,
    get_current_user,
    get_current_active_user,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Import database configuration
from src.database import get_db, engine

# Try to import models
try:
    from models import User, Tour, Lead, Property
    MODELS_AVAILABLE = True
    print("✅ Models imported successfully")
except ImportError as e:
    print(f"⚠️ Models import failed: {e}")
    MODELS_AVAILABLE = False

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Vocaria API starting up...")
    yield
    print("🛑 Vocaria API shutting down...")
    await engine.dispose()

# Authentication Models
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

# User Models
class UserBase(BaseModel):
    email: EmailStr
    username: str
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

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
        db_url = os.getenv('DATABASE_URL')
        return {
            "status": "✅ healthy",
            "database": {
                "status": "✅ available" if db_url else "❌ not configured",
                "url": "[HIDDEN]" if db_url else None,
                "type": db_url.split('://')[0] if db_url and '://' in db_url else None
            },
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

# Auth endpoints
@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    result = await db.execute(select(User).filter(User.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_active=True
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Get user by email
    result = await db.execute(select(User).filter(User.email == form_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    # Return token and user info
    user_dict = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_active": user.is_active,
        "created_at": user.created_at
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }

@app.get("/api/auth/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# ENDPOINTS DE USUARIOS
@app.get("/api/users", response_model=List[UserResponse])
async def get_users(db: AsyncSession = Depends(get_db)):
    if not MODELS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Models not available")
    
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users

@app.post("/api/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    if not MODELS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Models not available")
    
    # Verificar si el usuario ya existe
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    
    # Crear nuevo usuario con contraseña hasheada
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
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

# ========================================
# INMOBILIARIO ENDPOINTS
# ========================================

class TourCreate(BaseModel):
    name: str
    matterport_model_id: str
    agent_objective: str = "Schedule a visit"

class TourResponse(BaseModel):
    id: int
    name: str
    matterport_model_id: str
    agent_objective: str
    is_active: bool
    created_at: datetime

class LeadCreate(BaseModel):
    tour_id: int
    email: EmailStr
    phone: Optional[str] = None
    room_context: Optional[Dict[str, Any]] = None

class LeadResponse(BaseModel):
    id: int
    tour_id: int
    email: str
    phone: Optional[str]
    room_context: Optional[Dict[str, Any]]
    created_at: datetime

# CREATE TOUR
@app.post("/api/tours", response_model=TourResponse)
async def create_tour(tour: TourCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new Matterport tour for the current user"""
    new_tour = Tour(
        owner_id=current_user.id,
        name=tour.name,
        matterport_model_id=tour.matterport_model_id,
        agent_objective=tour.agent_objective
    )
    db.add(new_tour)
    await db.commit()
    await db.refresh(new_tour)
    return new_tour

# GET USER TOURS
@app.get("/api/tours", response_model=List[TourResponse])
async def get_user_tours(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all tours for the current user"""
    result = await db.execute(select(Tour).where(Tour.owner_id == current_user.id))
    tours = result.scalars().all()
    return tours

# CREATE LEAD
@app.post("/api/leads", response_model=LeadResponse)
async def create_lead(lead: LeadCreate, db: AsyncSession = Depends(get_db)):
    """Create a new lead for a tour (public endpoint for widget)"""
    # Verify tour exists
    result = await db.execute(select(Tour).where(Tour.id == lead.tour_id))
    tour = result.scalar_one_or_none()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    new_lead = Lead(
        tour_id=lead.tour_id,
        email=lead.email,
        phone=lead.phone,
        room_context=lead.room_context
    )
    db.add(new_lead)
    await db.commit()
    await db.refresh(new_lead)
    return new_lead

# GET TOUR LEADS
@app.get("/api/tours/{tour_id}/leads", response_model=List[LeadResponse])
async def get_tour_leads(tour_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all leads for a specific tour (owner only)"""
    # Verify tour ownership
    result = await db.execute(select(Tour).where(Tour.id == tour_id, Tour.owner_id == current_user.id))
    tour = result.scalar_one_or_none()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found or access denied")
    
    # Get leads
    result = await db.execute(select(Lead).where(Lead.tour_id == tour_id))
    leads = result.scalars().all()
    return leads

