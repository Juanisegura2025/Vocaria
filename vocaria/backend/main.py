from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, text, func  # ✅ FIXED: Added func
from sqlalchemy.sql import extract  # ✅ FIXED: Added extract
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

# NEW: Manual Property Upload Model
class ManualPropertyUpload(BaseModel):
    """Manual property data upload when Matterport import fails"""
    property_name: str
    description: Optional[str] = None
    address_line1: str
    city: str
    state: Optional[str] = None
    country: str = "Argentina"
    total_area: float
    bedrooms: int
    bathrooms: float
    price: Optional[float] = None
    currency: Optional[str] = "USD"
    property_type: str = "apartment"
    amenities: Optional[str] = None
    year_built: Optional[int] = None
    parking_spaces: Optional[int] = 0
    rooms_detail: Optional[str] = None

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
    """Get all tours for the current user - UPDATED TO INCLUDE PROPERTY DATA"""
    try:
        print(f"🔍 Getting tours for user: {current_user.id}")
        
        # Get tours with their properties
        result = await db.execute(
            select(Tour)
            .where(Tour.owner_id == current_user.id)
            .order_by(Tour.created_at.desc())
        )
        
        tours = result.scalars().all()
        print(f"✅ Found {len(tours)} tours")
        
        response_tours = []
        for tour in tours:
            # Try to get property data if agent_context exists
            property_data = None
            if tour.agent_context and tour.matterport_data_imported:
                # Parse agent context to extract property data
                # This is a simplified approach - in production you might want to store this more structurally
                lines = tour.agent_context.split('\n')
                property_info = {}
                for line in lines:
                    if ': ' in line:
                        key, value = line.split(': ', 1)
                        key = key.strip('- ')
                        if 'Name' in key:
                            property_info['matterport_name'] = value
                        elif 'Location' in key:
                            parts = value.split(', ')
                            if len(parts) >= 2:
                                property_info['address_line1'] = parts[0]
                                property_info['city'] = parts[1] if len(parts) > 1 else None
                                property_info['country'] = parts[-1] if len(parts) > 2 else None
                        elif 'Total Area' in key:
                            try:
                                property_info['total_area_floor'] = float(value.replace(' m²', ''))
                            except:
                                pass
                
                if property_info:
                    property_data = PropertyData(**property_info)
            
            tour_response = TourResponse(
                id=tour.id,
                name=tour.name,
                matterport_model_id=tour.matterport_model_id,
                agent_objective=tour.agent_objective,
                is_active=tour.is_active,
                created_at=tour.created_at,
                matterport_data_imported=tour.matterport_data_imported or False,
                matterport_share_url=tour.matterport_share_url,
                property_data=property_data,
                import_status="manual" if tour.agent_context and not tour.matterport_share_url else ("success" if tour.matterport_data_imported else "not_imported")
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

# NEW: Manual Property Data Upload Endpoint
@app.put("/api/tours/{tour_id}/manual-data")
async def update_tour_manual_data(
    tour_id: int,
    property_data: ManualPropertyUpload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update tour with manual property data"""
    
    # Get tour and verify ownership
    result = await db.execute(
        select(Tour).where(Tour.id == tour_id, Tour.owner_id == current_user.id)
    )
    tour = result.scalar_one_or_none()
    
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found or access denied")
    
    # Generate agent context from manual data
    agent_context = f"""Property Information:
- Name: {property_data.property_name}
- Type: {property_data.property_type}
- Location: {property_data.address_line1}, {property_data.city}, {property_data.country}
- Total Area: {property_data.total_area} m²
- Bedrooms: {property_data.bedrooms}
- Bathrooms: {property_data.bathrooms}
{f"- Year Built: {property_data.year_built}" if property_data.year_built else ""}
{f"- Parking Spaces: {property_data.parking_spaces}" if property_data.parking_spaces else ""}
{f"- Price: {property_data.currency} {property_data.price:,.0f}" if property_data.price else ""}
{f"- Description: {property_data.description}" if property_data.description else ""}
{f"- Rooms Detail: {property_data.rooms_detail}" if property_data.rooms_detail else ""}
{f"- Amenities: {property_data.amenities}" if property_data.amenities else ""}"""
    
    # Update tour fields
    tour.agent_context = agent_context.strip()
    tour.matterport_data_imported = True  # Mark as having data
    
    # Store room data in a structured format
    rooms = []
    if property_data.bedrooms > 0:
        for i in range(property_data.bedrooms):
            rooms.append({
                "label": f"Bedroom {i+1}",
                "floor_id": 0,
                "position": {"x": 0, "y": 0, "z": 0}
            })
    
    if property_data.bathrooms > 0:
        for i in range(int(property_data.bathrooms)):
            rooms.append({
                "label": f"Bathroom {i+1}",
                "floor_id": 0,
                "position": {"x": 0, "y": 0, "z": 0}
            })
    
    # Add common rooms
    rooms.extend([
        {"label": "Living Room", "floor_id": 0, "position": {"x": 0, "y": 0, "z": 0}},
        {"label": "Kitchen", "floor_id": 0, "position": {"x": 0, "y": 0, "z": 0}}
    ])
    
    tour.room_data = rooms
    
    # Update the tour name if different
    if property_data.property_name and property_data.property_name != tour.name:
        tour.name = property_data.property_name
    
    await db.commit()
    await db.refresh(tour)
    
    # Return updated tour in TourResponse format
    return TourResponse(
        id=tour.id,
        name=tour.name,
        matterport_model_id=tour.matterport_model_id,
        agent_objective=tour.agent_objective,
        is_active=tour.is_active,
        created_at=tour.created_at,
        matterport_data_imported=True,
        matterport_share_url=tour.matterport_share_url,
        property_data=PropertyData(
            matterport_name=property_data.property_name,
            matterport_description=property_data.description,
            address_line1=property_data.address_line1,
            city=property_data.city,
            state=property_data.state,
            country=property_data.country,
            total_area_floor=property_data.total_area,
            dimension_units="metric",
            rooms_count=len(rooms),
            rooms_summary=property_data.rooms_detail
        ),
        import_status="manual"
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
    
    # If tour has manual data (agent_context), return that
    if tour.agent_context:
        # Parse the context to extract structured data
        return {
            "tour_id": tour_id,
            "property_name": tour.name,
            "total_area": 0,  # Could parse from agent_context if needed
            "rooms": tour.room_data if tour.room_data else [],
            "agent_context": tour.agent_context,
            "matterport_model_id": tour.matterport_model_id,
            "data_source": "manual"
        }
    
    # Otherwise try to extract fresh data from Matterport
    if MATTERPORT_AVAILABLE and tour.matterport_model_id:
        try:
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
                "matterport_model_id": tour.matterport_model_id,
                "data_source": "matterport"
            }
        except Exception as e:
            print(f"Failed to get Matterport data: {e}")
    
    # Fallback response
    return {
        "tour_id": tour_id,
        "property_name": tour.name,
        "total_area": 0,
        "rooms": [],
        "agent_context": f"Property: {tour.name}",
        "matterport_model_id": tour.matterport_model_id,
        "data_source": "none"
    }

# ========================================
# ANALYTICS ENDPOINTS
# ========================================

@app.get("/api/analytics/stats")
async def get_analytics_stats(
    start_date: str = None,
    end_date: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get analytics statistics for the current user"""
    try:
        print(f"🔍 Analytics request for user: {current_user.id}")
        
        # Parse dates or use defaults
        if start_date:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        else:
            start = datetime.now() - timedelta(days=30)
        
        if end_date:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        else:
            end = datetime.now()
        
        print(f"📊 Date range: {start} to {end}")
        
        # Get user's tours
        tours_query = select(Tour).where(Tour.owner_id == current_user.id)
        tours_result = await db.execute(tours_query)
        user_tours = tours_result.scalars().all()
        tour_ids = [tour.id for tour in user_tours]
        
        print(f"🏠 Found {len(user_tours)} tours for user")
        
        if not tour_ids:
            print("⚠️ No tours found, returning empty analytics")
            return {
                "total_leads": 0,
                "active_tours": 0,
                "total_tours": 0,
                "conversion_rate": 0.0,
                "leads_by_month": [],
                "top_tours": [],
                "recent_activity": [],
                "date_range": {
                    "start": start.isoformat(),
                    "end": end.isoformat()
                }
            }
        
        # Total leads
        leads_query = select(func.count(Lead.id)).where(
            Lead.tour_id.in_(tour_ids),
            Lead.created_at >= start,
            Lead.created_at <= end
        )
        total_leads_result = await db.execute(leads_query)
        total_leads = total_leads_result.scalar() or 0
        
        print(f"📧 Total leads: {total_leads}")
        
        # Active tours
        active_tours = len([tour for tour in user_tours if tour.is_active])
        
        # Leads by month
        leads_by_month_query = select(
            extract('month', Lead.created_at).label('month'),
            extract('year', Lead.created_at).label('year'),
            func.count(Lead.id).label('count')
        ).where(
            Lead.tour_id.in_(tour_ids),
            Lead.created_at >= start,
            Lead.created_at <= end
        ).group_by(
            extract('month', Lead.created_at),
            extract('year', Lead.created_at)
        ).order_by(
            extract('year', Lead.created_at),
            extract('month', Lead.created_at)
        )
        
        leads_by_month_result = await db.execute(leads_by_month_query)
        leads_by_month_data = leads_by_month_result.all()
        
        # Format leads by month
        leads_by_month = []
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        for row in leads_by_month_data:
            month_name = month_names[int(row.month) - 1] if row.month else 'Unknown'
            leads_by_month.append({
                "month": month_name,
                "leads": int(row.count),
                "tours": active_tours
            })
        
        # Top performing tours
        top_tours_query = select(
            Tour.id,
            Tour.name,
            func.count(Lead.id).label('leads_count')
        ).join(
            Lead, Tour.id == Lead.tour_id, isouter=True
        ).where(
            Tour.owner_id == current_user.id
        ).group_by(
            Tour.id, Tour.name
        ).order_by(
            func.count(Lead.id).desc()
        ).limit(5)
        
        top_tours_result = await db.execute(top_tours_query)
        top_tours_data = top_tours_result.all()
        
        top_tours = [
            {
                "tour_name": row.name,
                "leads_count": int(row.leads_count) if row.leads_count else 0
            }
            for row in top_tours_data
        ]
        
        # Calculate conversion rate
        conversion_rate = (total_leads / len(user_tours)) * 100 if user_tours else 0.0
        
        # Recent activity
        recent_leads_query = select(Lead, Tour.name.label('tour_name')).join(
            Tour, Lead.tour_id == Tour.id
        ).where(
            Lead.tour_id.in_(tour_ids)
        ).order_by(
            Lead.created_at.desc()
        ).limit(10)
        
        recent_leads_result = await db.execute(recent_leads_query)
        recent_leads_data = recent_leads_result.all()
        
        recent_activity = [
            {
                "type": "lead_captured",
                "description": f"New lead from {row.tour_name}",
                "email": row.Lead.email,
                "created_at": row.Lead.created_at.isoformat(),
                "tour_name": row.tour_name
            }
            for row in recent_leads_data
        ]
        
        analytics_result = {
            "total_leads": total_leads,
            "active_tours": active_tours,
            "total_tours": len(user_tours),
            "conversion_rate": round(conversion_rate, 1),
            "leads_by_month": leads_by_month,
            "top_tours": top_tours,
            "recent_activity": recent_activity,
            "date_range": {
                "start": start.isoformat(),
                "end": end.isoformat()
            }
        }
        
        print(f"✅ Analytics calculated successfully: {analytics_result}")
        return analytics_result
        
    except Exception as e:
        print(f"❌ Analytics error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Error calculating analytics: {str(e)}")

# ========================================
# CONVERSATION ENDPOINTS
# ========================================

@app.post("/api/conversations/start")
async def start_conversation(
    tour_id: str,
    visitor_id: str = None,
    room_context: dict = None,
    user_agent: str = None,
    ip_address: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Start a new conversation"""
    try:
        from uuid import UUID
        from src.vocaria.db.models import Conversation
        
        # Validate tour_id is a valid UUID
        try:
            UUID(tour_id)
        except ValueError:
            raise HTTPException(400, "Invalid tour_id format")
        
        result = await db.execute(select(Tour).where(Tour.id == tour_id))
        tour = result.scalar_one_or_none()
        if not tour:
            raise HTTPException(404, "Tour not found")
        
        conversation = Conversation(
            tour_id=tour_id,
            visitor_id=visitor_id or f"visitor_{int(time.time())}",
            room_context=room_context,
            user_agent=user_agent,
            ip_address=ip_address,
            started_at=datetime.utcnow()
        )
        
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        
        return {
            "conversation_id": str(conversation.id),
            "visitor_id": conversation.visitor_id,
            "started_at": conversation.started_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(500, f"Error starting conversation: {str(e)}")

@app.post("/api/conversations/{conversation_id}/messages")
async def add_conversation_message(
    conversation_id: str,
    content: str,
    is_user: bool,
    message_type: str = "text",
    room_context: dict = None,
    audio_duration: float = None,
    confidence_score: float = None,
    db: AsyncSession = Depends(get_db)
):
    """Add a message to a conversation"""
    try:
        from uuid import UUID
        from src.vocaria.db.models import Conversation, ConversationMessage
        
        # Validate conversation_id is a valid UUID
        try:
            UUID(conversation_id)
        except ValueError:
            raise HTTPException(400, "Invalid conversation_id format")
        
        result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(404, "Conversation not found")
        
        message = ConversationMessage(
            conversation_id=conversation_id,
            content=content,
            is_user=is_user,
            message_type=message_type,
            room_context=room_context,
            audio_duration=audio_duration,
            confidence_score=confidence_score,
            timestamp=datetime.utcnow()
        )
        
        db.add(message)
        conversation.message_count += 1
        
        # If this is a user message with contact info, update the conversation
        if is_user and not conversation.lead_captured:
            if "@" in content and "." in content:
                conversation.visitor_email = content
                conversation.lead_captured = True
            elif any(char.isdigit() for char in content.replace(" ", "")) and len(content.replace(" ", "")) >= 8:
                conversation.visitor_phone = content
                conversation.lead_captured = True
        
        await db.commit()
        await db.refresh(message)
        
        return {
            "message_id": str(message.id),
            "timestamp": message.timestamp.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(500, f"Error adding message: {str(e)}")

@app.get("/api/transcripts")
async def get_transcripts(
    tour_id: str = None,
    start_date: str = None,
    end_date: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get conversation transcripts for the current user"""
    try:
        from uuid import UUID
        from sqlalchemy.orm import selectinload
        from src.vocaria.db.models import Conversation, ConversationMessage
        
        # Validate tour_id if provided
        if tour_id:
            try:
                UUID(tour_id)
            except ValueError:
                raise HTTPException(400, "Invalid tour_id format")
        
        query = select(Conversation).options(
            selectinload(Conversation.messages),
            selectinload(Conversation.tour),
            selectinload(Conversation.lead)
        ).join(Tour).where(Tour.owner_id == current_user.id)
        
        if tour_id:
            query = query.where(Conversation.tour_id == tour_id)
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.where(Conversation.started_at >= start_dt)
            except ValueError:
                raise HTTPException(400, "Invalid start_date format. Use ISO 8601 format")
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                # Add one day to include the entire end date
                end_dt = end_dt + timedelta(days=1)
                query = query.where(Conversation.started_at <= end_dt)
            except ValueError:
                raise HTTPException(400, "Invalid end_date format. Use ISO 8601 format")
        
        query = query.order_by(Conversation.started_at.desc())
        
        result = await db.execute(query)
        conversations = result.scalars().all()
        
        transcripts = []
        for conv in conversations:
            transcript = {
                "conversation_id": str(conv.id),
                "tour_name": conv.tour.name,
                "tour_id": str(conv.tour_id),
                "visitor_id": conv.visitor_id,
                "started_at": conv.started_at.isoformat() if conv.started_at else None,
                "ended_at": conv.ended_at.isoformat() if conv.ended_at else None,
                "duration_seconds": conv.duration_seconds,
                "message_count": conv.message_count,
                "lead_captured": conv.lead_captured,
                "visitor_email": conv.visitor_email,
                "visitor_phone": conv.visitor_phone,
                "room_context": conv.room_context,
                "messages": [
                    {
                        "id": str(msg.id),
                        "content": msg.content,
                        "is_user": msg.is_user,
                        "message_type": msg.message_type,
                        "timestamp": msg.timestamp.isoformat(),
                        "room_context": msg.room_context,
                        "audio_duration": msg.audio_duration,
                        "confidence_score": msg.confidence_score
                    }
                    for msg in sorted(conv.messages, key=lambda m: m.timestamp)
                ]
            }
            transcripts.append(transcript)
        
        return {
            "transcripts": transcripts,
            "total_count": len(transcripts)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error fetching transcripts: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Vocaria API server...")
    uvicorn.run(app, host="0.0.0.0", port=8001)