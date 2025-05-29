"""
Usage-related schemas for the Vocaria API.

This module contains Pydantic models for tracking and reporting resource usage
such as TTS minutes and message counts.
"""
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from pydantic import Field, validator

from .base import BaseModel, IDModelMixin, DateTimeModelMixin

# Shared properties
class UsageBase(BaseModel):
    """Base usage schema with common fields."""
    tour_id: str = Field(..., description="ID of the tour this usage is associated with")
    date: date = Field(..., description="Date of the usage record")
    tts_seconds: float = Field(
        0.0,
        description="Number of seconds of TTS usage"
    )
    message_count: int = Field(
        0,
        description="Number of messages sent"
    )
    api_call_count: int = Field(
        0,
        description="Number of API calls made"
    )
    metadata_: Optional[Dict[str, Any]] = Field(
        None,
        alias="metadata",
        description="Additional metadata for the usage record"
    )
    
    class Config:
        allow_population_by_field_name = True

# Properties to receive on usage creation
class UsageCreate(UsageBase):
    """Schema for creating a new usage record."""
    pass

# Properties to receive on usage update
class UsageUpdate(BaseModel):
    """Schema for updating an existing usage record."""
    tts_seconds: Optional[float] = Field(
        None,
        description="Updated number of seconds of TTS usage"
    )
    message_count: Optional[int] = Field(
        None,
        description="Updated number of messages sent"
    )
    api_call_count: Optional[int] = Field(
        None,
        description="Updated number of API calls made"
    )
    metadata_: Optional[Dict[str, Any]] = Field(
        None,
        alias="metadata",
        description="Additional metadata for the usage record"
    )
    
    class Config:
        allow_population_by_field_name = True

# Properties shared by models stored in DB
class UsageInDBBase(IDModelMixin, DateTimeModelMixin, UsageBase):
    """Base usage schema for database models."""
    class Config:
        orm_mode = True

# Properties to return to client
class UsageResponse(UsageInDBBase):
    """Usage schema for API responses."""
    tts_minutes: float = Field(
        ...,
        description="Number of minutes of TTS usage (read-only)",
        alias="tts_minutes"
    )
    
    @validator('tts_minutes', pre=True)
    def calculate_tts_minutes(cls, v, values):
        """Calculate TTS minutes from seconds."""
        if v is not None:
            return v
        return values.get('tts_seconds', 0) / 60.0

# Properties stored in DB
class UsageInDB(UsageInDBBase):
    """Usage schema for database operations."""
    pass

# Additional schemas
class UsageSummary(BaseModel):
    """Summary of usage statistics."""
    total_tts_minutes: float = Field(
        0.0,
        description="Total TTS minutes used"
    )
    total_messages: int = Field(
        0,
        description="Total number of messages sent"
    )
    total_api_calls: int = Field(
        0,
        description="Total number of API calls made"
    )
    average_messages_per_day: float = Field(
        0.0,
        description="Average number of messages per day"
    )
    average_tts_minutes_per_day: float = Field(
        0.0,
        description="Average TTS minutes used per day"
    )

class UsageByDate(UsageSummary):
    """Usage statistics grouped by date."""
    date: date = Field(..., description="Date of the usage")

class UsageByTour(UsageSummary):
    """Usage statistics grouped by tour."""
    tour_id: str = Field(..., description="ID of the tour")
    tour_name: str = Field(..., description="Name of the tour")

class UsageReport(BaseModel):
    """Comprehensive usage report."""
    summary: UsageSummary = Field(
        ...,
        description="Overall usage summary"
    )
    by_date: List[UsageByDate] = Field(
        default_factory=list,
        description="Usage statistics grouped by date"
    )
    by_tour: List[UsageByTour] = Field(
        default_factory=list,
        description="Usage statistics grouped by tour"
    )
    start_date: date = Field(
        ...,
        description="Start date of the report period"
    )
    end_date: date = Field(
        ...,
        description="End date of the report period"
    )

class UsageLimit(BaseModel):
    """Usage limits for a tour or user."""
    max_tts_minutes: Optional[float] = Field(
        None,
        description="Maximum allowed TTS minutes per month"
    )
    max_messages: Optional[int] = Field(
        None,
        description="Maximum allowed messages per month"
    )
    max_api_calls: Optional[int] = Field(
        None,
        description="Maximum allowed API calls per month"
    )

class UsageAlert(BaseModel):
    """Usage alert configuration."""
    threshold_percent: int = Field(
        80,
        ge=1,
        le=100,
        description="Percentage of limit at which to send an alert"
    )
    email_recipients: List[str] = Field(
        default_factory=list,
        description="List of email addresses to send alerts to"
    )
    
    @validator('email_recipients', each_item=True)
    def validate_emails(cls, v):
        """Validate email addresses."""
        from pydantic import EmailStr, EmailError
        try:
            return EmailStr.validate(v)
        except EmailError:
            raise ValueError(f"Invalid email address: {v}")
