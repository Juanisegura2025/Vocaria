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
    room_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
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
    address = Column(String(200), nullable=True)
    price = Column(Float, nullable=True)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    area_m2 = Column(Float, nullable=True)
    property_type = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    tour = relationship("Tour", back_populates="property")
