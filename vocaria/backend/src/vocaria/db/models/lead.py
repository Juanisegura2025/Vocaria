"""
Lead model for managing potential customers.

This module defines the Lead model which represents a potential customer
who has interacted with a tour.
"""
from datetime import datetime
from typing import Optional, Dict, Any, TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Column, String, ForeignKey, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB, VECTOR

from vocaria.db.base import Base

if TYPE_CHECKING:
    from .tour import Tour
    from .conversation import Conversation

class Lead(Base):
    """Lead model representing a potential customer."""
    __tablename__ = "leads"
    
    # Tour relationship
    tour_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tours.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tour: Mapped["Tour"] = relationship(
        "Tour",
        back_populates="leads",
    )
    
    # Contact information
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )
    
    # Context and metadata
    room_context: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )
    
    metadata_: Mapped[Dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )
    
    # Vector embedding for similarity search
    embedding: Mapped[Optional[Any]] = mapped_column(
        VECTOR(384),  # Dimension for all-MiniLM-L6-v2 model
        nullable=True,
    )
    
    # Relationships
    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation",
        back_populates="lead",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    def __repr__(self) -> str:
        return f"<Lead {self.email} ({self.id})>"
    
    @property
    def name(self) -> str:
        """Get the lead's name if available in metadata, otherwise use email."""
        return (
            self.metadata_.get("name")
            or self.email.split("@")[0]
        )
    
    @property
    def last_interaction(self) -> Optional[datetime]:
        """Get the timestamp of the last interaction with this lead."""
        if not self.conversations:
            return None
        return max(conv.ended_at or conv.started_at for conv in self.conversations)

# Add GIN index for JSONB fields and composite index for tour/email uniqueness
Index("idx_lead_room_context_gin", Lead.room_context, postgresql_using="gin")
Index("idx_lead_metadata_gin", Lead.metadata_, postgresql_using="gin")
Index("idx_lead_tour_email", Lead.tour_id, Lead.email, unique=True)
