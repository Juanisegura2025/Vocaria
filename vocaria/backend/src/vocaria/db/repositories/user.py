"""
User repository for database operations.

This module contains the UserRepository class which provides methods for
interacting with the users table in the database.
"""
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from sqlalchemy import select, update, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from vocaria.db.models import User
from vocaria.schemas.user import UserCreate, UserUpdate
from .base import BaseRepository

class UserRepository(BaseRepository[User, UserCreate, UserUpdate]):
    """Repository for User model with custom methods."""
    
    def __init__(self):
        """Initialize the UserRepository with the User model."""
        super().__init__(User)
    
    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """Get a user by email.
        
        Args:
            db: Database session
            email: User's email address
            
        Returns:
            Optional[User]: The user if found, None otherwise
        """
        result = await db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_by_username(self, db: AsyncSession, username: str) -> Optional[User]:
        """Get a user by username.
        
        Args:
            db: Database session
            username: User's username
            
        Returns:
            Optional[User]: The user if found, None otherwise
        """
        result = await db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()
    
    async def authenticate(
        self, 
        db: AsyncSession, 
        *, 
        email: str, 
        password: str
    ) -> Optional[User]:
        """Authenticate a user.
        
        Args:
            db: Database session
            email: User's email
            password: Plain text password
            
        Returns:
            Optional[User]: The user if authentication is successful, None otherwise
        """
        user = await self.get_by_email(db, email=email)
        if not user:
            return None
        if not user.verify_password(password):
            return None
        return user
    
    async def create(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        """Create a new user with hashed password.
        
        Args:
            db: Database session
            obj_in: User creation data
            
        Returns:
            User: The created user
        """
        db_obj = User(
            email=obj_in.email,
            hashed_password=obj_in.password,  # The model will hash the password
            full_name=obj_in.full_name,
            is_active=obj_in.is_active if hasattr(obj_in, 'is_active') else True,
            is_superuser=obj_in.is_superuser if hasattr(obj_in, 'is_superuser') else False,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    
    async def update(
        self, 
        db: AsyncSession, 
        *, 
        db_obj: User, 
        obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        """Update a user, handling password updates specially.
        
        Args:
            db: Database session
            db_obj: The user to update
            obj_in: Update data
            
        Returns:
            User: The updated user
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        # Handle password update
        if "password" in update_data:
            hashed_password = update_data.pop("password")
            db_obj.hashed_password = hashed_password  # Will be hashed by the model
        
        # Update other fields
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    
    async def update_last_login(self, db: AsyncSession, user_id: Union[str, UUID]) -> None:
        """Update the last login timestamp for a user.
        
        Args:
            db: Database session
            user_id: ID of the user to update
        """
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(last_login=func.now())
        )
        await db.commit()
    
    async def activate(self, db: AsyncSession, user_id: Union[str, UUID]) -> bool:
        """Activate a user account.
        
        Args:
            db: Database session
            user_id: ID of the user to activate
            
        Returns:
            bool: True if the user was activated, False if not found
        """
        result = await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(is_active=True)
            .returning(User.id)
        )
        await db.commit()
        return result.scalar_one_or_none() is not None
    
    async def deactivate(self, db: AsyncSession, user_id: Union[str, UUID]) -> bool:
        """Deactivate a user account.
        
        Args:
            db: Database session
            user_id: ID of the user to deactivate
            
        Returns:
            bool: True if the user was deactivated, False if not found
        """
        result = await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(is_active=False)
            .returning(User.id)
        )
        await db.commit()
        return result.scalar_one_or_none() is not None

# Create a singleton instance for easy importing
user_repo = UserRepository()
