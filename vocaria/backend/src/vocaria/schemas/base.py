"""Base schemas for the Vocaria API.

This module contains base Pydantic models that are used as mixins or base classes
for other schemas throughout the application.
"""
from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar, Union
from pydantic import BaseModel as PydanticBaseModel, Field
from pydantic.generics import GenericModel

# Type variable for generic model
T = TypeVar('T')

class BaseModel(PydanticBaseModel):
    """Base model for all Pydantic models with configuration."""
    
    class Config:
        orm_mode = True
        arbitrary_types_allowed = True
        json_encoders = {
            # Custom JSON encoders can be added here
            datetime: lambda v: v.isoformat()
        }

class IDModelMixin(BaseModel):
    ""
    Mixin for models that have an ID field.
    
    This is used to ensure consistent ID field naming and typing.
    """
    id: str = Field(..., description="Unique identifier")

class DateTimeModelMixin(BaseModel):
    """
    Mixin for models that have created_at and updated_at fields.
    
    This is used to ensure consistent timestamp field naming and typing.
    """
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

class PaginatedResponse(GenericModel, Generic[T]):
    """
    Generic paginated response model.
    
    This is used as a base for all paginated API responses.
    """
    items: List[T] = Field(..., description="List of items in the current page")
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Number of items per page")
    pages: int = Field(..., description="Total number of pages")

class ErrorResponse(BaseModel):
    """Standard error response model."""
    detail: Union[str, Dict[str, Any]] = Field(
        ...,
        description="Error details or message"
    )
    code: Optional[str] = Field(
        None,
        description="Error code for programmatic handling"
    )

class SuccessResponse(BaseModel):
    """Standard success response model."""
    success: bool = Field(True, description="Indicates if the operation was successful")
    message: Optional[str] = Field(
        None,
        description="Optional success message"
    )
    data: Optional[Any] = Field(
        None,
        description="Response data if applicable"
    )

class EmptyResponse(SuccessResponse):
    """Empty success response model."""
    data: None = None

class ListResponse(SuccessResponse, GenericModel, Generic[T]):
    """List response model."""
    data: List[T] = Field(..., description="List of items")
