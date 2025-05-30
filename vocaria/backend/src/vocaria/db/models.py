"""
Database models for Vocaria Admin Panel.

This module contains SQLAlchemy models for the Vocaria real estate virtual agent SaaS.
"""
from datetime import datetime
from enum import Enum as PyEnum
from typing import Dict, Any, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean, Column, DateTime, Enum as SQLEnum, ForeignKey, 
    Integer, JSON, String, Text, event
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.sql import func

Base = declarative_base()

def generate_uuid():
    return str(uuid4())

class UserRole(str, PyEnum):
    CLIENT = "client"
    SUPER_ADMIN = "super_admin"

class SubscriptionStatus(str, PyEnum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    UNPAID = "unpaid"
    TRIALING = "trialing"
    INCOMPLETE = "incomplete"
    INCOMPLETE_EXPIRED = "incomplete_expired"

class User(Base):
    """User model for the admin panel."""
    __tablename__ = "users"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.CLIENT, nullable=False)
    stripe_customer_id = Column(String(255), unique=True, nullable=True)
    subscription_status = Column(SQLEnum(SubscriptionStatus), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tours = relationship("Tour", back_populates="owner", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User {self.email}>"

class Tour(Base):
    """Property tour model for virtual showings."""
    __tablename__ = "tours"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    name = Column(String(255), nullable=False)
    matterport_model_id = Column(String(255), nullable=True)
    agent_id = Column(String(255), nullable=True, comment="ElevenLabs agent ID")
    agent_objective = Column(Text, nullable=True, comment="Instructions for the AI agent")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="tours")
    leads = relationship("Lead", back_populates="tour", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Tour {self.name}>"

class Lead(Base):
    """Lead model for potential clients interested in properties."""
    __tablename__ = "leads"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    room_context = Column(JSONB, nullable=True, comment="Current room context in the tour")
    metadata = Column(JSONB, nullable=True, comment="Additional metadata as JSON")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    tour_id = Column(PG_UUID(as_uuid=True), ForeignKey("tours.id"), nullable=False)
    tour = relationship("Tour", back_populates="leads")

    def __repr__(self) -> str:
        return f"<Lead {self.email}>"
