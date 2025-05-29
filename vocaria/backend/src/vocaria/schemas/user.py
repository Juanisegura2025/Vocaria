"""
User-related schemas for the Vocaria API.

This module contains Pydantic models for user-related operations such as
registration, authentication, and profile management.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import EmailStr, Field, validator, root_validator

from .base import BaseModel, IDModelMixin, DateTimeModelMixin

# Shared properties
class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: Optional[EmailStr] = Field(
        None,
        description="User's email address (must be unique)"
    )
    full_name: Optional[str] = Field(
        None,
        max_length=255,
        description="User's full name"
    )
    is_active: Optional[bool] = Field(
        True,
        description="Whether the user account is active"
    )
    is_superuser: Optional[bool] = Field(
        False,
        description="Whether the user has superuser privileges"
    )

# Properties to receive via API on creation
class UserCreate(UserBase):
    """Schema for creating a new user."""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="User's password (plaintext, will be hashed)"
    )
    full_name: str = Field(..., description="User's full name")
    
    @validator('password')
    def password_strength(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v

# Properties to receive via API on update
class UserUpdate(UserBase):
    """Schema for updating an existing user."""
    password: Optional[str] = Field(
        None,
        min_length=8,
        max_length=128,
        description="New password (plaintext, will be hashed)"
    )
    current_password: Optional[str] = Field(
        None,
        description="Current password (required when changing password)"
    )
    
    @root_validator
    def check_password_change(cls, values):
        """Validate password change request."""
        password = values.get('password')
        current_password = values.get('current_password')
        
        if password and not current_password:
            raise ValueError('Current password is required to change password')
            
        return values

# Properties shared by models stored in DB
class UserInDBBase(IDModelMixin, DateTimeModelMixin, UserBase):
    """Base user schema for database models."""
    email: EmailStr
    is_active: bool = True
    is_superuser: bool = False
    
    class Config:
        orm_mode = True

# Properties to return to client
class UserResponse(UserInDBBase):
    """User schema for API responses."""
    pass

# Properties stored in DB
class UserInDB(UserInDBBase):
    """User schema for database operations."""
    hashed_password: str
    
    def to_response(self) -> 'UserResponse':
        """Convert to response model, excluding sensitive data."""
        return UserResponse(
            **self.dict(
                exclude={"hashed_password"},
                exclude_unset=True
            )
        )

# Additional schemas
class UserRegister(UserCreate):
    """Schema for user registration."""
    password_confirm: str = Field(..., description="Password confirmation")
    
    @validator('password_confirm')
    def passwords_match(cls, v, values, **kwargs):
        """Validate that password and confirmation match."""
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")
    remember_me: bool = Field(
        False,
        description="Whether to create a long-lived session"
    )

class UserPasswordReset(BaseModel):
    """Schema for password reset request."""
    email: EmailStr = Field(..., description="User's email address")

class UserPasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation."""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., description="New password")

class UserProfileUpdate(BaseModel):
    """Schema for updating user profile."""
    full_name: Optional[str] = Field(None, description="User's full name")
    avatar_url: Optional[str] = Field(None, description="URL to user's avatar image")
    
    class Config:
        schema_extra = {
            "example": {
                "full_name": "John Doe",
                "avatar_url": "https://example.com/avatar.jpg"
            }
        }
