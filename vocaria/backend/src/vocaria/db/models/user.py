"""
User model for authentication and authorization.

This module defines the User model for handling application users and their authentication.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB

from vocaria.db.base import Base
from vocaria.core.security import get_password_hash, verify_password

class User(Base):
    """User model for authentication and authorization."""
    __tablename__ = "users"
    
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Hashed password using bcrypt"
    )
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean(),
        default=True,
        nullable=False,
    )
    is_superuser: Mapped[bool] = mapped_column(
        Boolean(),
        default=False,
        nullable=False,
    )
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
    )
    subscription_data: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        server_default="{}",
    )
    
    # Relationships
    tours: Mapped[List["Tour"]] = relationship(
        "Tour",
        back_populates="owner",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    def __repr__(self) -> str:
        return f"<User {self.email}>"
    
    def set_password(self, password: str) -> None:
        """Set hashed password.
        
        Args:
            password: Plain text password
        """
        self.hashed_password = get_password_hash(password)
    
    def check_password(self, password: str) -> bool:
        """Verify password.
        
        Args:
            password: Plain text password to verify
            
        Returns:
            bool: True if password is correct, False otherwise
        """
        return verify_password(password, self.hashed_password)
    
    @property
    def is_authenticated(self) -> bool:
        """Check if user is authenticated."""
        return self.is_active
    
    @property
    def display_name(self) -> str:
        """Get user's display name (full name or email)."""
        return self.full_name or self.email.split("@")[0]
