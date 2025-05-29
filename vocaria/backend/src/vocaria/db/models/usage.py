"""
Usage model for tracking resource usage.

This module defines the Usage model which tracks TTS minutes, messages,
and other usage metrics for each tour.
"""
from datetime import date, datetime
from typing import Optional, TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Column, ForeignKey, Integer, Numeric, Date, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from vocaria.db.base import Base

if TYPE_CHECKING:
    from .tour import Tour

class Usage(Base):
    """Usage model for tracking resource usage per tour."""
    __tablename__ = "usages"
    
    # Tour relationship
    tour_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tours.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tour: Mapped["Tour"] = relationship(
        "Tour",
        back_populates="usages",
    )
    
    # Usage metrics
    minutes_tts: Mapped[float] = mapped_column(
        Numeric(10, 2),
        default=0.0,
        nullable=False,
    )
    messages: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    leads_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    
    # Time window for this usage record
    window_start: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )
    window_end: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )
    
    def __repr__(self) -> str:
        return f"<Usage {self.tour_id} ({self.window_start} to {self.window_end})>"
    
    @property
    def period(self) -> str:
        """Get the period type based on the window duration."""
        if (self.window_end - self.window_start).days == 0:
            return "daily"
        elif (self.window_end - self.window_start).days == 6:
            return "weekly"
        else:
            return "monthly"

# Add composite index for tour/window uniqueness
Index(
    "idx_usage_tour_window",
    Usage.tour_id,
    Usage.window_start,
    Usage.window_end,
    unique=True,
)
