"""
Database models for Vocaria.

This module contains SQLAlchemy models for the Vocaria database schema.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from vocaria.core.config import settings
from vocaria.schemas.enums import (
    LeadStatus,
    ConversationStatus,
    MessageType,
    UserRole,
)

Base = declarative_base()

class User(Base):
    """User model."""
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tours = relationship("Tour", back_populates="owner", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="owner", cascade="all, delete-orphan")
    files = relationship("File", back_populates="owner", cascade="all, delete-orphan")

class Tour(Base):
    """Tour model."""
    __tablename__ = "tours"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    address = Column(String)
    status = Column(Enum(LeadStatus), default=LeadStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="tours")
    leads = relationship("Lead", back_populates="tour", cascade="all, delete-orphan")
    files = relationship("File", back_populates="tour", cascade="all, delete-orphan")

class Lead(Base):
    """Lead model."""
    __tablename__ = "leads"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    notes = Column(Text)
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tour_id = Column(String, ForeignKey("tours.id"), nullable=False)
    tour = relationship("Tour", back_populates="leads")
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="leads")
    conversations = relationship("Conversation", back_populates="lead", cascade="all, delete-orphan")
    files = relationship("File", back_populates="lead", cascade="all, delete-orphan")

class Conversation(Base):
    """Conversation model."""
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, index=True)
    status = Column(Enum(ConversationStatus), default=ConversationStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    lead_id = Column(String, ForeignKey("leads.id"), nullable=False)
    lead = relationship("Lead", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    """Message model."""
    __tablename__ = "messages"

    id = Column(String, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    role = Column(Enum(MessageType), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    conversation = relationship("Conversation", back_populates="messages")

class File(Base):
    """File model."""
    __tablename__ = "files"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    unique_filename = Column(String, nullable=False, unique=True)
    content_type = Column(String, nullable=False)
    size = Column(Integer)
    metadata = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="files")
    tour_id = Column(String, ForeignKey("tours.id"))
    tour = relationship("Tour", back_populates="files")
    lead_id = Column(String, ForeignKey("leads.id"))
    lead = relationship("Lead", back_populates="files")

class CacheItem(Base):
    """Cache item model."""
    __tablename__ = "cache_items"

    id = Column(String, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    value = Column(Text, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
