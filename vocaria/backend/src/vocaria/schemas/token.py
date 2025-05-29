"""
Token-related schemas for authentication.

This module contains Pydantic models for handling JWT tokens and related data.
"""
from datetime import datetime
from typing import Optional

from pydantic import Field

from .base import BaseModel, DateTimeModelMixin

class Token(BaseModel):
    """Token response model.
    
    This is returned when a user logs in or refreshes their token.
    """
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field("bearer", description="Token type, typically 'bearer'")
    expires_in: Optional[int] = Field(
        None,
        description="Number of seconds until the token expires"
    )
    refresh_token: Optional[str] = Field(
        None,
        description="Refresh token that can be used to obtain a new access token"
    )

class TokenPayload(BaseModel):
    """Token payload model.
    
    This represents the decoded payload of a JWT token.
    """
    sub: Optional[str] = Field(None, description="Subject (user ID)")
    exp: Optional[datetime] = Field(None, description="Expiration time")
    iat: Optional[datetime] = Field(None, description="Issued at time")
    nbf: Optional[datetime] = Field(None, description="Not before time")
    jti: Optional[str] = Field(None, description="JWT ID")
    type: Optional[str] = Field(
        None,
        description="Token type (e.g., 'access', 'refresh', 'reset', etc.)"
    )
    scopes: list[str] = Field(
        [],
        description="List of scopes/permissions granted to the token"
    )

class TokenData(BaseModel):
    """Token data model for internal use."""
    username: Optional[str] = None
    scopes: list[str] = []

class TokenCreate(BaseModel):
    """Token creation model."""
    username: str
    password: str
    scopes: Optional[list[str]] = []

class TokenRefresh(BaseModel):
    """Token refresh model."""
    refresh_token: str = Field(..., description="Refresh token")
