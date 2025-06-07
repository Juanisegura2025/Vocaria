from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # NUEVOS CAMPOS INMOBILIARIOS
    company_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    subscription_status = Column(String(20), default="trial")
    
    # Relaciones inmobiliarias
    tours = relationship("Tour", back_populates="owner")

class Tour(Base):
    __tablename__ = "tours"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    matterport_model_id = Column(String(100), nullable=False)
    agent_id = Column(String(100), nullable=True)
    agent_objective = Column(Text, default="Schedule a visit")
    is_active = Column(Boolean, default=True)
    room_data = Column(JSON, nullable=True)  # Data de habitaciones de Matterport
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # NUEVOS CAMPOS PARA MATTERPORT INTEGRATION
    matterport_data_imported = Column(Boolean, default=False)
    matterport_last_sync = Column(DateTime(timezone=True), nullable=True)
    matterport_share_url = Column(String(500), nullable=True)
    matterport_embed_url = Column(String(500), nullable=True)
    agent_context = Column(Text, nullable=True)  # Contexto formateado para el agente
    
    # Relaciones
    owner = relationship("User", back_populates="tours")
    leads = relationship("Lead", back_populates="tour")
    property = relationship("Property", back_populates="tour", uselist=False)

class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    tour_id = Column(Integer, ForeignKey("tours.id"), nullable=False)
    email = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    room_context = Column(JSON, nullable=True)
    lead_data = Column(JSON, nullable=True)  # Additional lead data (renamed from metadata)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    tour = relationship("Tour", back_populates="leads")

class Property(Base):
    __tablename__ = "properties"
    
    id = Column(Integer, primary_key=True, index=True)
    tour_id = Column(Integer, ForeignKey("tours.id"), nullable=False)
    
    # ========================================
    # INFORMACIÓN BÁSICA (Manual + Matterport)
    # ========================================
    address = Column(String(200), nullable=True)  # Dirección manual o combinada
    price = Column(Float, nullable=True)  # Precio manual
    bedrooms = Column(Integer, nullable=True)  # Manual
    bathrooms = Column(Integer, nullable=True)  # Manual
    area_m2 = Column(Float, nullable=True)  # Manual o de Matterport
    property_type = Column(String(50), nullable=True)  # Manual
    description = Column(Text, nullable=True)  # Manual o de Matterport
    
    # ========================================
    # INFORMACIÓN DE MATTERPORT (Automática)
    # ========================================
    
    # Información básica del modelo
    matterport_name = Column(String(200), nullable=True)
    matterport_description = Column(Text, nullable=True)
    matterport_visibility = Column(String(50), nullable=True)
    matterport_created_at = Column(DateTime(timezone=True), nullable=True)
    matterport_modified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Dirección completa de Matterport
    address_line1 = Column(String(200), nullable=True)
    address_line2 = Column(String(200), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)
    
    # Dimensiones totales de Matterport
    total_area_floor = Column(Float, nullable=True)  # Área total del piso
    total_area_floor_indoor = Column(Float, nullable=True)  # Área interior solamente
    total_volume = Column(Float, nullable=True)  # Volumen total
    dimension_units = Column(String(20), default="metric")  # metric o imperial
    
    # Data estructurada de habitaciones y pisos (JSON)
    rooms_data = Column(JSON, nullable=True)  # Array de habitaciones con dimensiones
    floors_data = Column(JSON, nullable=True)  # Array de pisos con dimensiones
    
    # URLs importantes
    share_url = Column(String(500), nullable=True)  # URL para compartir
    embed_url = Column(String(500), nullable=True)  # URL para embed
    
    # Metadatos de importación
    data_source = Column(String(50), default="manual")  # "manual", "matterport", "mixed"
    matterport_import_success = Column(Boolean, default=False)
    matterport_import_errors = Column(JSON, nullable=True)  # Errores durante importación
    last_matterport_sync = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    tour = relationship("Tour", back_populates="property")