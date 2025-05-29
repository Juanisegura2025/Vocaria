"""
Base model for SQLAlchemy models.

This module provides a base class for all database models with common functionality
like timestamps and utility methods.
"""
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, func, event
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column

class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models.
    
    Provides common columns and methods for all models.
    """
    __abstract__ = True
    
    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid4,
        server_default=func.gen_random_uuid(),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        index=True,
    )
    
    @declared_attr
    def __tablename__(cls) -> str:
        """Generate table name from class name."""
        return cls.__name__.lower() + "s"
    
    def to_dict(self, exclude: Optional[list] = None) -> Dict[str, Any]:
        """Convert model to dictionary.
        
        Args:
            exclude: List of field names to exclude from the result
            
        Returns:
            Dictionary representation of the model
        """
        if exclude is None:
            exclude = []
            
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
            if column.name not in exclude
        }
    
    def update(self, **kwargs) -> None:
        """Update model attributes.
        
        Args:
            **kwargs: Attributes to update
        """
        for key, value in kwargs.items():
            if hasattr(self, key) and value is not None:
                setattr(self, key, value)

# Add event listener to update timestamps
@event.listens_for(Base, 'before_update', propagate=True)
def receive_before_update(mapper, connection, target):
    """Update the updated_at timestamp before any update."""
    target.updated_at = datetime.utcnow()
