"""
Tour model for managing property tours.

This module defines the Tour model which represents a virtual property tour
that can be explored by users.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy import Column, String, Boolean, ForeignKey, Text, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB

from vocaria.db.base import Base

class Tour(Base):
    """Tour model representing a virtual property tour."""
    __tablename__ = "tours"
    
    # Owner relationship
    owner_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    owner: Mapped["User"] = relationship(
        "User",
        back_populates="tours",
    )
    
    # Tour details
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    matterport_model_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    agent_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="ElevenLabs agent ID for this tour",
    )
    agent_objective: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="Schedule a visit",
        server_default="Schedule a visit",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
    
    # Room data and metadata
    room_data: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )
    
    # Relationships
    leads: Mapped[List["Lead"]] = relationship(
        "Lead",
        back_populates="tour",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    usages: Mapped[List["Usage"]] = relationship(
        "Usage",
        back_populates="tour",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    conversations: Mapped[List["Conversation"]] = relationship(
        "Conversation",
        back_populates="tour",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    def __repr__(self) -> str:
        return f"<Tour {self.name} ({self.id})>"
    
    @property
    def lead_count(self) -> int:
        """Get the number of leads for this tour."""
        return len(self.leads)
    
    @property
    def total_usage_minutes(self) -> float:
        """Get the total TTS minutes used for this tour."""
        return sum(usage.minutes_tts for usage in self.usages)
    
    @property
    def total_messages(self) -> int:
        """Get the total number of messages for this tour."""
        return sum(usage.messages for usage in self.usages)

# Add GIN index for JSONB fields
Index("idx_tour_room_data_gin", Tour.room_data, postgresql_using="gin")
