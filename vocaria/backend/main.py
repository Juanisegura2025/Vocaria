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

# ✅ FIXED: Import models correctly
try:
    from src.models import User, Tour, Lead, Property
    MODELS_AVAILABLE = True
    print("✅ Models imported successfully")
except ImportError as e:
    print(f"⚠️ Models import failed: {e}")
    MODELS_AVAILABLE = False

# Import Matterport service
try:
    from src.matterport_service import matterport_service
    MATTERPORT_AVAILABLE = True
    print("✅ Matterport service imported successfully")
except ImportError as e:
    print(f"⚠️ Matterport service import failed: {e}")
    MATTERPORT_AVAILABLE = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Vocaria API starting up...")
    yield
    print("🛑 Vocaria API shutting down...")
    await engine.dispose()

# ========================================
# PYDANTIC MODELS (CLEAN - NO DUPLICATES)
# ========================================

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

# Tour Models
class TourCreate(BaseModel):
    name: str
    matterport_model_id: str
    agent_objective: str = "Schedule a visit"

class PropertyData(BaseModel):
    """Datos de propiedad importados de Matterport"""
    # Básicos
    matterport_name: Optional[str] = None
    matterport_description: Optional[str] = None
    
    # Dirección
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    
    # Dimensiones
    total_area_floor: Optional[float] = None
    total_area_floor_indoor: Optional[float] = None
    dimension_units: str = "metric"
    
    # Habitaciones (simplified for response)
    rooms_count: int = 0
    rooms_summary: Optional[str] = None

class TourResponse(BaseModel):
    id: int
    name: str
    matterport_model_id: str
    agent_objective: str
    is_active: bool
    created_at: datetime
    
    # NUEVOS CAMPOS MATTERPORT
    matterport_data_imported: bool = False
    matterport_share_url: Optional[str] = None
    property_data: Optional[PropertyData] = None
    import_status: Optional[str] = None  # "success", "partial", "failed"

# Lead Models
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

# ========================================
# FASTAPI APP SETUP
# ========================================

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

# ========================================
# BASIC ENDPOINTS
# ========================================

@app.get("/")
async def root():
    return {
        "message": "🎤 Vocaria API - Funcionando!",
        "version": "1.0.0",
        "status": "✅ Ready",
        "models_loaded": MODELS_AVAILABLE,
        "matterport_available": MATTERPORT_AVAILABLE,
        "endpoints": [
            "GET /health - Estado del sistema",
            "GET / - Este endpoint"
        ]
    }

@app.get("/health")
async def health_check():
    try:
        db_url = os.getenv('DATABASE_URL')
        matterport_configured = bool(os.getenv('MATTERPORT_TOKEN_ID') and os.getenv('MATTERPORT_TOKEN_SECRET'))
        
        return {
            "status": "✅ healthy",
            "database": {
                "status": "✅ available" if db_url else "❌ not configured",
                "url": "[HIDDEN]" if db_url else None,
                "type": db_url.split('://')[0] if db_url and '://' in db_url else None
            },
            "models": "✅ loaded" if MODELS_AVAILABLE else "⚠️ not loaded",
            "matterport": {
                "service": "✅ available" if MATTERPORT_AVAILABLE else "❌ not loaded",
                "configured": "✅ configured" if matterport_configured else "⚠️ not configured"
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "⚠️ limited", 
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# ========================================
# AUTH ENDPOINTS
# ========================================

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

# ========================================
# USER ENDPOINTS
# ========================================

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

# ========================================
# TOURS ENDPOINTS CON MATTERPORT
# ========================================

@app.post("/api/tours", response_model=TourResponse)
async def create_tour(tour: TourCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new Matterport tour with automatic data import"""
    
    # Crear el tour base
    new_tour = Tour(
        owner_id=current_user.id,
        name=tour.name,
        matterport_model_id=tour.matterport_model_id,
        agent_objective=tour.agent_objective,
        matterport_data_imported=False
    )
    
    # Variables para tracking del import
    import_status = "pending"
    property_data = None
    import_errors = []
    
    try:
        # Intentar importar datos de Matterport
        if MATTERPORT_AVAILABLE and matterport_service.configured:
            print(f"🔍 Importing Matterport data for model: {tour.matterport_model_id}")
            
            # Extraer datos del modelo
            model_data = await matterport_service.extract_model_data(tour.matterport_model_id)
            
            # Crear registro de Property con datos importados
            new_property = Property(
                tour=new_tour,  # Será asociado cuando se guarde el tour
                
                # Datos básicos
                matterport_name=model_data.name,
                matterport_description=model_data.description,
                matterport_visibility=model_data.visibility,
                
                # Dirección
                address_line1=model_data.address_line1,
                address_line2=model_data.address_line2,
                city=model_data.city,
                state=model_data.state,
                postal_code=model_data.postal_code,
                country=model_data.country,
                
                # Dimensiones
                total_area_floor=model_data.total_area_floor,
                total_area_floor_indoor=model_data.total_area_floor_indoor,
                total_volume=model_data.total_volume,
                dimension_units=model_data.units,
                
                # Data estructurada
                rooms_data=[room.dict() for room in model_data.rooms],
                floors_data=[floor.dict() for floor in model_data.floors],
                
                # URLs
                share_url=model_data.share_url,
                embed_url=model_data.embed_url,
                
                # Metadatos
                data_source="matterport",
                matterport_import_success=True,
                last_matterport_sync=datetime.now()
            )
            
            # Actualizar tour con datos importados
            new_tour.matterport_data_imported = True
            new_tour.matterport_last_sync = datetime.now()
            new_tour.matterport_share_url = model_data.share_url
            new_tour.matterport_embed_url = model_data.embed_url
            new_tour.room_data = [room.dict() for room in model_data.rooms]
            
            # Generar contexto para el agente
            agent_context = matterport_service.format_for_agent_context(model_data)
            new_tour.agent_context = agent_context
            
            import_status = "success"
            
            # Preparar property_data para respuesta
            property_data = PropertyData(
                matterport_name=model_data.name,
                matterport_description=model_data.description,
                address_line1=model_data.address_line1,
                city=model_data.city,
                state=model_data.state,
                country=model_data.country,
                total_area_floor=model_data.total_area_floor,
                total_area_floor_indoor=model_data.total_area_floor_indoor,
                dimension_units=model_data.units,
                rooms_count=len(model_data.rooms),
                rooms_summary=", ".join([room.label for room in model_data.rooms[:5]])  # Primeras 5 habitaciones
            )
            
            print(f"✅ Matterport data imported successfully")
            
        else:
            # Crear Property básico sin datos de Matterport
            new_property = Property(
                tour=new_tour,
                data_source="manual",
                matterport_import_success=False,
                matterport_import_errors=["Matterport service not configured"]
            )
            import_status = "not_configured"
            print(f"⚠️ Matterport service not available, creating tour without import")
            
    except Exception as e:
        # Si falla la importación, crear Property básico
        import_errors.append(str(e))
        new_property = Property(
            tour=new_tour,
            data_source="manual",
            matterport_import_success=False,
            matterport_import_errors=import_errors
        )
        import_status = "failed"
        print(f"❌ Matterport import failed: {e}")
    
    # Guardar todo en la base de datos
    try:
        db.add(new_tour)
        await db.commit()
        await db.refresh(new_tour)
        
        # Asociar y guardar Property
        new_property.tour_id = new_tour.id
        db.add(new_property)
        await db.commit()
        
        print(f"✅ Tour created successfully: {new_tour.id}")
        
    except Exception as e:
        await db.rollback()
        print(f"❌ Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving tour: {str(e)}")
    
    # Preparar respuesta
    return TourResponse(
        id=new_tour.id,
        name=new_tour.name,
        matterport_model_id=new_tour.matterport_model_id,
        agent_objective=new_tour.agent_objective,
        is_active=new_tour.is_active,
        created_at=new_tour.created_at,
        matterport_data_imported=new_tour.matterport_data_imported,
        matterport_share_url=new_tour.matterport_share_url,
        property_data=property_data,
        import_status=import_status
    )

@app.get("/api/tours", response_model=List[TourResponse])
async def get_user_tours(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all tours for the current user - SIMPLE VERSION FIXED"""
    try:
        print(f"🔍 Getting tours for user: {current_user.id}")
        
        # QUERY SIMPLE SIN PROPERTY JOIN (EVITA ERRORES)
        result = await db.execute(
            select(Tour.id, Tour.name, Tour.matterport_model_id, Tour.agent_objective, 
                   Tour.is_active, Tour.created_at, Tour.matterport_data_imported, 
                   Tour.matterport_share_url, Tour.agent_id)
            .where(Tour.owner_id == current_user.id)
            .order_by(Tour.created_at.desc())
        )
        
        tours = result.all()
        print(f"✅ Found {len(tours)} tours")
        
        response_tours = []
        for tour in tours:
            tour_response = TourResponse(
                id=tour.id,
                name=tour.name,
                matterport_model_id=tour.matterport_model_id,
                agent_objective=tour.agent_objective,
                is_active=tour.is_active,
                created_at=tour.created_at,
                matterport_data_imported=tour.matterport_data_imported or False,
                matterport_share_url=tour.matterport_share_url,
                property_data=None,  # Simplificado sin Property JOIN
                import_status="not_imported" if not tour.matterport_data_imported else "success"
            )
            response_tours.append(tour_response)
        
        print(f"✅ Returning {len(response_tours)} tours successfully")
        return response_tours
        
    except Exception as e:
        print(f"❌ ERROR in get_user_tours: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tours: {str(e)}"
        )

@app.delete("/api/tours/{tour_id}")
async def delete_tour(
    tour_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Delete a tour (owner only)"""
    # Get the tour and verify ownership
    result = await db.execute(select(Tour).where(Tour.id == tour_id, Tour.owner_id == current_user.id))
    tour = result.scalar_one_or_none()
    
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found or access denied")
    
    # Delete the tour (Property will be deleted by cascade)
    await db.delete(tour)
    await db.commit()
    
    return {"message": "Tour deleted successfully"}

# ========================================
# LEADS ENDPOINTS
# ========================================

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

@app.get("/api/tours/{tour_id}/context")
async def get_tour_context(tour_id: str, db: AsyncSession = Depends(get_db)):
    """Get real-time property context for widget"""
    
    # Get tour from database
    result = await db.execute(select(Tour).where(Tour.id == int(tour_id)))
    tour = result.scalar_one_or_none()
    
    if not tour:
        raise HTTPException(404, "Tour not found")
    
    # Extract fresh data from Matterport
    model_data = await matterport_service.extract_model_data(tour.matterport_model_id)
    
    # Return structured context
    return {
        "tour_id": tour_id,
        "property_name": model_data.name,
        "total_area": model_data.total_area_floor,
        "rooms": [
            {"name": room.label, "area": room.area_floor} 
            for room in model_data.rooms
        ],
        "agent_context": matterport_service.format_for_agent_context(model_data),
        "matterport_model_id": tour.matterport_model_id
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Vocaria API server...")
    uvicorn.run(app, host="0.0.0.0", port=8001)