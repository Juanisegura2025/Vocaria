"""
Tour-related schemas for the Vocaria API.

This module contains Pydantic models for tour-related operations such as
creating, updating, and retrieving property tours.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import Field, validator, HttpUrl

from .base import BaseModel, IDModelMixin, DateTimeModelMixin

# Shared properties
class TourBase(BaseModel):
    """Base tour schema with common fields."""
    name: str = Field(
        ...,
        max_length=255,
        description="Name of the tour"
    )
    matterport_model_id: str = Field(
        ...,
        description="Matterport model ID for this tour"
    )
    description: Optional[str] = Field(
        None,
        description="Optional description of the tour"
    )
    is_active: bool = Field(
        True,
        description="Whether the tour is active and accessible"
    )
    metadata_: Optional[Dict[str, Any]] = Field(
        None,
        alias="metadata",
        description="Additional metadata for the tour"
    )
    
    class Config:
        allow_population_by_field_name = True

# Properties to receive on tour creation
class TourCreate(TourBase):
    """Schema for creating a new tour."""
    pass

# Properties to receive on tour update
class TourUpdate(BaseModel):
    """Schema for updating an existing tour."""
    name: Optional[str] = Field(
        None,
        max_length=255,
        description="Updated name of the tour"
    )
    description: Optional[str] = Field(
        None,
        description="Updated description of the tour"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Whether the tour is active and accessible"
    )
    metadata_: Optional[Dict[str, Any]] = Field(
        None,
        alias="metadata",
        description="Additional metadata for the tour"
    )
    
    class Config:
        allow_population_by_field_name = True

# Properties shared by models stored in DB
class TourInDBBase(IDModelMixin, DateTimeModelMixin, TourBase):
    """Base tour schema for database models."""
    owner_id: str = Field(..., description="ID of the user who owns this tour")
    agent_id: Optional[str] = Field(
        None,
        description="ID of the AI agent assigned to this tour"
    )
    
    class Config:
        orm_mode = True

# Properties to return to client
class TourResponse(TourInDBBase):
    """Tour schema for API responses."""
    lead_count: int = Field(
        0,
        description="Number of leads generated from this tour"
    )
    total_usage_minutes: float = Field(
        0.0,
        description="Total TTS minutes used for this tour"
    )
    total_messages: int = Field(
        0,
        description="Total number of messages sent in this tour"
    )

# Properties stored in DB
class TourInDB(TourInDBBase):
    """Tour schema for database operations."""
    pass

# Additional schemas
class TourWithLeads(TourResponse):
    """Tour schema including lead information."""
    leads: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of leads associated with this tour"
    )

class TourListResponse(BaseModel):
    """Response model for listing tours with pagination."""
    items: List[TourResponse] = Field(
        ...,
        description="List of tours"
    )
    total: int = Field(
        ...,
        description="Total number of tours"
    )
    page: int = Field(
        ...,
        description="Current page number"
    )
    size: int = Field(
        ...,
        description="Number of items per page"
    )
    pages: int = Field(
        ...,
        description="Total number of pages"
    )

class TourWidgetConfig(BaseModel):
    """Configuration for the tour widget."""
    primary_color: str = Field(
        "#2563eb",
        description="Primary color for the widget (hex code)"
    )
    position: str = Field(
        "bottom-right",
        description="Position of the widget on the page",
        regex="^(top|bottom)-(left|right)$"
    )
    greeting_message: str = Field(
        "Hello! How can I help you today?",
        description="Initial greeting message"
    )
    
    @validator('primary_color')
    def validate_hex_color(cls, v):
        """Validate that the color is a valid hex code."""
        if not v.startswith('#'):
            raise ValueError('Color must start with #')
        if len(v) not in (4, 7):
            raise ValueError('Color must be 3 or 6 digits long')
        return v.lower()

class TourCreateWithConfig(TourCreate):
    """Schema for creating a tour with widget configuration."""
    widget_config: Optional[TourWidgetConfig] = Field(
        None,
        description="Configuration for the tour widget"
    )

class TourUpdateWithConfig(TourUpdate):
    """Schema for updating a tour with widget configuration."""
    widget_config: Optional[TourWidgetConfig] = Field(
        None,
        description="Updated configuration for the tour widget"
    )
