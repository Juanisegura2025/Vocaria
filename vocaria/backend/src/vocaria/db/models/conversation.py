"""
Conversation model for tracking interactions with leads.

This module defines the Conversation model which stores chat history
and metadata for interactions between leads and the AI agent.
"""
from datetime import datetime
from typing import List, Dict, Any, Optional, TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Column, String, ForeignKey, Text, Numeric, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB

from vocaria.db.base import Base

if TYPE_CHECKING:
    from .tour import Tour
    from .lead import Lead

class Conversation(Base):
    """Conversation model for tracking interactions with leads."""
    __tablename__ = "conversations"
    
    # Relationships
    tour_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tours.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tour: Mapped["Tour"] = relationship(
        "Tour",
        back_populates="conversations",
    )
    
    lead_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    lead: Mapped[Optional["Lead"]] = relationship(
        "Lead",
        back_populates="conversations",
    )
    
    # Conversation data
    messages: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default="[]",
    )
    
    # Session information
    session_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )
    
    # Timing information
    started_at: Mapped[datetime] = mapped_column(
        nullable=False,
        index=True,
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        index=True,
    )
    duration_seconds: Mapped[float] = mapped_column(
        Numeric(10, 2),
        default=0.0,
        nullable=False,
    )
    
    # Metadata
    metadata_: Mapped[Dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )
    
    def __repr__(self) -> str:
        return f"<Conversation {self.session_id} ({self.tour_id})>"
    
    @property
    def message_count(self) -> int:
        """Get the number of messages in this conversation."""
        return len(self.messages)
    
    @property
    def is_active(self) -> bool:
        """Check if the conversation is still active (not ended)."""
        return self.ended_at is None

# Add GIN index for JSONB fields
Index("idx_conversation_messages_gin", Conversation.messages, postgresql_using="gin")
Index("idx_conversation_metadata_gin", Conversation.metadata_, postgresql_using="gin")
