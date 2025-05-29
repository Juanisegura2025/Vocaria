"""
Lead-related schemas for the Vocaria API.

This module contains Pydantic models for lead-related operations such as
creating, updating, and retrieving leads from property tours.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
from pydantic import Field, validator, EmailStr, HttpUrl

from .base import BaseModel, IDModelMixin, DateTimeModelMixin

class LeadStatus(str, Enum):
    """Enumeration of possible lead statuses."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"
    UNQUALIFIED = "unqualified"

# Shared properties
class LeadBase(BaseModel):
    """Base lead schema with common fields."""
    email: Optional[EmailStr] = Field(
        None,
        description="Lead's email address"
    )
    phone: Optional[str] = Field(
        None,
        description="Lead's phone number"
    )
    first_name: Optional[str] = Field(
        None,
        max_length=100,
        description="Lead's first name"
    )
    last_name: Optional[str] = Field(
        None,
        max_length=100,
        description="Lead's last name"
    )
    status: LeadStatus = Field(
        LeadStatus.NEW,
        description="Current status of the lead"
    )
    metadata_: Optional[Dict[str, Any]] = Field(
        None,
        alias="metadata",
        description="Additional metadata for the lead"
    )
    
    class Config:
        allow_population_by_field_name = True

# Properties to receive on lead creation
class LeadCreate(LeadBase):
    """Schema for creating a new lead."""
    tour_id: str = Field(..., description="ID of the tour this lead is associated with")
    email: Optional[EmailStr] = Field(
        None,
        description="Lead's email address (either email or phone is required)"
    )
    phone: Optional[str] = Field(
        None,
        description="Lead's phone number (either email or phone is required)"
    )
    
    @root_validator
    def check_email_or_phone(cls, values):
        """Validate that either email or phone is provided."""
        email = values.get('email')
        phone = values.get('phone')
        
        if not email and not phone:
            raise ValueError('Either email or phone must be provided')
            
        return values

# Properties to receive on lead update
class LeadUpdate(BaseModel):
    """Schema for updating an existing lead."""
    email: Optional[EmailStr] = Field(
        None,
        description="Updated email address"
    )
    phone: Optional[str] = Field(
        None,
        description="Updated phone number"
    )
    first_name: Optional[str] = Field(
        None,
        max_length=100,
        description="Updated first name"
    )
    last_name: Optional[str] = Field(
        None,
        max_length=100,
        description="Updated last name"
    )
    status: Optional[LeadStatus] = Field(
        None,
        description="Updated status of the lead"
    )
    metadata_: Optional[Dict[str, Any]] = Field(
        None,
        alias="metadata",
        description="Additional metadata for the lead"
    )
    
    class Config:
        allow_population_by_field_name = True

# Properties shared by models stored in DB
class LeadInDBBase(IDModelMixin, DateTimeModelMixin, LeadBase):
    """Base lead schema for database models."""
    tour_id: str = Field(..., description="ID of the tour this lead is associated with")
    
    class Config:
        orm_mode = True

# Properties to return to client
class LeadResponse(LeadInDBBase):
    """Lead schema for API responses."""
    conversation_count: int = Field(
        0,
        description="Number of conversations with this lead"
    )
    last_activity: Optional[datetime] = Field(
        None,
        description="Timestamp of the last activity with this lead"
    )

# Properties stored in DB
class LeadInDB(LeadInDBBase):
    """Lead schema for database operations."""
    pass

# Additional schemas
class LeadWithTour(LeadResponse):
    """Lead schema including tour information."""
    tour: Dict[str, Any] = Field(
        ...,
        description="Tour associated with this lead"
    )

class LeadListResponse(BaseModel):
    """Response model for listing leads with pagination."""
    items: List[LeadResponse] = Field(
        ...,
        description="List of leads"
    )
    total: int = Field(
        ...,
        description="Total number of leads"
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

class LeadFilter(BaseModel):
    """Filtering options for querying leads."""
    tour_id: Optional[str] = Field(
        None,
        description="Filter by tour ID"
    )
    status: Optional[LeadStatus] = Field(
        None,
        description="Filter by lead status"
    )
    start_date: Optional[datetime] = Field(
        None,
        description="Filter leads created after this date"
    )
    end_date: Optional[datetime] = Field(
        None,
        description="Filter leads created before this date"
    )
    search: Optional[str] = Field(
        None,
        description="Search term to filter leads by name, email, or phone"
    )

class LeadNoteCreate(BaseModel):
    """Schema for creating a note on a lead."""
    content: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Content of the note"
    )
    is_important: bool = Field(
        False,
        description="Whether this note is important"
    )

class LeadNoteResponse(IDModelMixin, DateTimeModelMixin):
    """Response model for lead notes."""
    content: str = Field(..., description="Content of the note")
    is_important: bool = Field(..., description="Whether this note is important")
    author_id: str = Field(..., description="ID of the user who created the note")
    author_name: str = Field(..., description="Name of the user who created the note")
