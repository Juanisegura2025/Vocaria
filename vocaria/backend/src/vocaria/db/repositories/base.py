"""
Base repository class for database operations.

This module provides a base repository class that implements common CRUD operations
and can be extended by other repository classes.
"""
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from uuid import UUID

from sqlalchemy import select, update, delete, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from vocaria.db.base import Base
from vocaria.schemas.base import BaseModel

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Base repository class with default CRUD operations."""

    def __init__(self, model: Type[ModelType]):
        """Initialize repository with a SQLAlchemy model.
        
        Args:
            model: SQLAlchemy model class
        """
        self.model = model

    async def get(self, db: AsyncSession, id: Union[str, UUID], **kwargs) -> Optional[ModelType]:
        """Get a single record by ID.
        
        Args:
            db: Database session
            id: Record ID
            **kwargs: Additional filter criteria
            
        Returns:
            Optional[ModelType]: The record if found, None otherwise
        """
        query = select(self.model).filter(
            self.model.id == id,
            *[getattr(self.model, k) == v for k, v in kwargs.items()]
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        **filters: Any,
    ) -> List[ModelType]:
        """Get multiple records with optional filtering and pagination.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            **filters: Filter criteria
            
        Returns:
            List[ModelType]: List of records
        """
        query = select(self.model).filter_by(**filters).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: CreateSchemaType) -> ModelType:
        """Create a new record.
        
        Args:
            db: Database session
            obj_in: Input data for the new record
            
        Returns:
            ModelType: The created record
        """
        db_obj = self.model(**obj_in.dict(exclude_unset=True))
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]],
    ) -> ModelType:
        """Update a record.
        
        Args:
            db: Database session
            db_obj: The record to update
            obj_in: Updated data
            
        Returns:
            ModelType: The updated record
        """
        update_data = obj_in if isinstance(obj_in, dict) else obj_in.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: Union[str, UUID]) -> Optional[ModelType]:
        """Delete a record by ID.
        
        Args:
            db: Database session
            id: Record ID
            
        Returns:
            Optional[ModelType]: The deleted record if found, None otherwise
        """
        obj = await self.get(db, id=id)
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

    async def count(self, db: AsyncSession, **filters: Any) -> int:
        """Count records matching the given filters.
        
        Args:
            db: Database session
            **filters: Filter criteria
            
        Returns:
            int: Number of matching records
        """
        query = select(func.count()).select_from(self.model).filter_by(**filters)
        result = await db.execute(query)
        return result.scalar_one()

    async def exists(self, db: AsyncSession, **filters: Any) -> bool:
        """Check if a record exists with the given filters.
        
        Args:
            db: Database session
            **filters: Filter criteria
            
        Returns:
            bool: True if a matching record exists, False otherwise
        """
        query = select(self.model).filter_by(**filters).limit(1)
        result = await db.execute(query)
        return result.scalar_one_or_none() is not None

    async def get_or_create(
        self,
        db: AsyncSession,
        *,
        obj_in: CreateSchemaType,
        **kwargs,
    ) -> tuple[ModelType, bool]:
        """Get a record or create it if it doesn't exist.
        
        Args:
            db: Database session
            obj_in: Input data for the new record
            **kwargs: Additional filter criteria
            
        Returns:
            tuple[ModelType, bool]: A tuple of (record, created) where created is a boolean
                indicating whether the record was created
        """
        # Create a dictionary of the unique fields to search for
        filter_data = {**obj_in.dict(), **kwargs}
        
        # Try to get the existing record
        db_obj = await self.get(db, **filter_data)
        
        if db_obj:
            return db_obj, False
            
        # Create a new record if it doesn't exist
        db_obj = await self.create(db, obj_in=obj_in)
        return db_obj, True
