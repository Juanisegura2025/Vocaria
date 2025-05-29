"""
Conversation-related schemas for the Vocaria API.

This module contains Pydantic models for managing conversations between
leads and the AI agent in property tours.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List, Literal
from enum import Enum
from pydantic import Field, validator, BaseModel as PydanticBaseModel

from .base import BaseModel, IDModelMixin, DateTimeModelMixin

class MessageRole(str, Enum):
    """Role of the message sender in a conversation."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    FUNCTION = "function"

class MessageType(str, Enum):
    """Type of message content."""
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    LOCATION = "location"
    BUTTON = "button"
    CAROUSEL = "carousel"
    CUSTOM = "custom"

class MessageStatus(str, Enum):
    """Status of a message in the conversation."""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"

class MessageContent(PydanticBaseModel):
    """Content of a message in a conversation."""
    type: MessageType = Field(
        MessageType.TEXT,
        description="Type of the message content"
    )
    text: Optional[str] = Field(
        None,
        description="Text content of the message"
    )
    url: Optional[str] = Field(
        None,
        description="URL of the media content (for image, video, audio, document)"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional metadata for the message"
    )

class Message(BaseModel):
    """A single message in a conversation."""
    role: MessageRole = Field(..., description="Role of the message sender")
    content: MessageContent = Field(..., description="Content of the message")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="When the message was sent"
    )
    status: MessageStatus = Field(
        MessageStatus.SENT,
        description="Current status of the message"
    )
    metadata_: Optional[Dict[str, Any]] = Field(
        None,
        alias="metadata",
        description="Additional metadata for the message"
    )
    
    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Shared properties
class ConversationBase(BaseModel):
    """Base conversation schema with common fields."""
    title: Optional[str] = Field(
        None,
        max_length=255,
        description="Title of the conversation"
    )
    is_active: bool = Field(
        True,
        description="Whether the conversation is currently active"
    )
    metadata_: Optional[Dict[str, Any]] = Field(
        None,
        alias="metadata",
        description="Additional metadata for the conversation"
    )
    
    class Config:
        allow_population_by_field_name = True

# Properties to receive on conversation creation
class ConversationCreate(ConversationBase):
    """Schema for creating a new conversation."""
    tour_id: str = Field(..., description="ID of the tour this conversation is associated with")
    lead_id: Optional[str] = Field(
        None,
        description="ID of the lead this conversation is with (if known)"
    )
    initial_message: Optional[Message] = Field(
        None,
        description="Optional initial message to start the conversation"
    )

# Properties to receive on conversation update
class ConversationUpdate(BaseModel):
    """Schema for updating an existing conversation."""
    title: Optional[str] = Field(
        None,
        max_length=255,
        description="Updated title of the conversation"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Whether the conversation is currently active"
    )
    metadata_: Optional[Dict[str, Any]] = Field(
        None,
        alias="metadata",
        description="Additional metadata for the conversation"
    )
    
    class Config:
        allow_population_by_field_name = True

# Properties shared by models stored in DB
class ConversationInDBBase(IDModelMixin, DateTimeModelMixin, ConversationBase):
    """Base conversation schema for database models."""
    tour_id: str = Field(..., description="ID of the tour this conversation is associated with")
    lead_id: Optional[str] = Field(
        None,
        description="ID of the lead this conversation is with"
    )
    message_count: int = Field(
        0,
        description="Number of messages in the conversation"
    )
    last_message_at: Optional[datetime] = Field(
        None,
        description="When the last message was sent"
    )
    
    class Config:
        orm_mode = True

# Properties to return to client
class ConversationResponse(ConversationInDBBase):
    """Conversation schema for API responses."""
    tour_name: Optional[str] = Field(
        None,
        description="Name of the tour this conversation is associated with"
    )
    lead_name: Optional[str] = Field(
        None,
        description="Name of the lead this conversation is with"
    )

# Properties stored in DB
class ConversationInDB(ConversationInDBBase):
    """Conversation schema for database operations."""
    pass

# Additional schemas
class ConversationWithMessages(ConversationResponse):
    """Conversation schema including its messages."""
    messages: List[Message] = Field(
        default_factory=list,
        description="Messages in the conversation"
    )

class ConversationListResponse(BaseModel):
    """Response model for listing conversations with pagination."""
    items: List[ConversationResponse] = Field(
        ...,
        description="List of conversations"
    )
    total: int = Field(
        ...,
        description="Total number of conversations"
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

class ConversationFilter(BaseModel):
    """Filtering options for querying conversations."""
    tour_id: Optional[str] = Field(
        None,
        description="Filter by tour ID"
    )
    lead_id: Optional[str] = Field(
        None,
        description="Filter by lead ID"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Filter by active status"
    )
    start_date: Optional[datetime] = Field(
        None,
        description="Filter conversations started after this date"
    )
    end_date: Optional[datetime] = Field(
        None,
        description="Filter conversations started before this date"
    )
    search: Optional[str] = Field(
        None,
        description="Search term to filter conversations by title or participant name"
    )

class NewMessage(BaseModel):
    """Schema for sending a new message in a conversation."""
    content: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Content of the message"
    )
    role: MessageRole = Field(
        MessageRole.USER,
        description="Role of the message sender"
    )
    metadata_: Optional[Dict[str, Any]] = Field(
        None,
        alias="metadata",
        description="Additional metadata for the message"
    )
    
    class Config:
        allow_population_by_field_name = True

class MessageResponse(Message):
    """Response model for a single message."""
    id: str = Field(..., description="Unique identifier for the message")
    conversation_id: str = Field(..., description="ID of the conversation this message belongs to")

class MessageListResponse(BaseModel):
    """Response model for listing messages with pagination."""
    items: List[MessageResponse] = Field(
        ...,
        description="List of messages"
    )
    total: int = Field(
        ...,
        description="Total number of messages"
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

class TypingIndicator(BaseModel):
    """Schema for typing indicators in conversations."""
    is_typing: bool = Field(
        ...,
        description="Whether the user is currently typing"
    )
    user_id: Optional[str] = Field(
        None,
        description="ID of the user who is typing (if applicable)"
    )
    conversation_id: str = Field(
        ...,
        description="ID of the conversation where typing is happening"
    )
