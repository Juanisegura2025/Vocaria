"""
Message schemas for API responses.

This module contains simple message response models used throughout the API.
"""
from pydantic import Field

from .base import BaseModel

class Msg(BaseModel):
    """Basic message response model.
    
    Used for simple success/error messages that don't require additional data.
    """
    msg: str = Field(..., description="Message content")

class SuccessMsg(Msg):
    """Success message response model."""
    success: bool = Field(True, description="Indicates success")

class ErrorMsg(Msg):
    """Error message response model."""
    error: str = Field(..., description="Error type or code")
    success: bool = Field(False, description="Indicates failure")
    details: dict = Field(
        default_factory=dict,
        description="Additional error details"
    )

class ValidationErrorMsg(ErrorMsg):
    """Validation error message response model."""
    error: str = "validation_error"
    loc: list = Field(
        default_factory=list,
        description="Location of the validation error"
    )
    type: str = Field(
        ...,
        description="Type of validation error"
    )

class NotFoundMsg(ErrorMsg):
    """Not found error message response model."""
    error: str = "not_found"
    resource: str = Field(
        ...,
        description="Type of resource that was not found"
    )
    id: str = Field(
        ...,
        description="ID of the resource that was not found"
    )

class UnauthorizedMsg(ErrorMsg):
    """Unauthorized error message response model."""
    error: str = "unauthorized"
    description: str = Field(
        "Not authenticated",
        description="Description of the authorization error"
    )

class ForbiddenMsg(ErrorMsg):
    """Forbidden error message response model."""
    error: str = "forbidden"
    description: str = Field(
        "Insufficient permissions",
        description="Description of the permission error"
    )

class RateLimitMsg(ErrorMsg):
    """Rate limit exceeded message response model."""
    error: str = "rate_limit_exceeded"
    retry_after: int = Field(
        ...,
        description="Number of seconds to wait before retrying"
    )
    limit: int = Field(
        ...,
        description="Maximum number of allowed requests"
    )
    period: str = Field(
        ...,
        description="Time period for the rate limit (e.g., '1 minute')"
    )
