"""
Tour repository for database operations.

This module contains the TourRepository class which provides methods for
interacting with the tours table in the database.
"""
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from sqlalchemy import select, update, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from vocaria.db.models import Tour, User, Lead, Usage
from vocaria.schemas.tour import TourCreate, TourUpdate, TourWithLeads
from .base import BaseRepository

class TourRepository(BaseRepository[Tour, TourCreate, TourUpdate]):
    """Repository for Tour model with custom methods."""
    
    def __init__(self):
        """Initialize the TourRepository with the Tour model."""
        super().__init__(Tour)
    
    async def get_with_owner(
        self, 
        db: AsyncSession, 
        id: Union[str, UUID],
        owner_id: Optional[Union[str, UUID]] = None
    ) -> Optional[Tour]:
        """Get a tour by ID, optionally filtering by owner.
        
        Args:
            db: Database session
            id: Tour ID
            owner_id: Optional owner ID to filter by
            
        Returns:
            Optional[Tour]: The tour if found and matches owner filter, None otherwise
        """
        query = select(Tour).where(Tour.id == id)
        
        if owner_id is not None:
            query = query.where(Tour.owner_id == owner_id)
            
        query = query.options(selectinload(Tour.owner))
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_multi_by_owner(
        self,
        db: AsyncSession,
        owner_id: Union[str, UUID],
        *,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> List[Tour]:
        """Get multiple tours owned by a specific user with optional filtering.
        
        Args:
            db: Database session
            owner_id: ID of the owner
            skip: Number of records to skip
            limit: Maximum number of records to return
            is_active: Filter by active status
            search: Search term to filter by tour name
            
        Returns:
            List[Tour]: List of matching tours
        """
        query = (
            select(Tour)
            .where(Tour.owner_id == owner_id)
            .options(selectinload(Tour.owner))
            .offset(skip)
            .limit(limit)
        )
        
        if is_active is not None:
            query = query.where(Tour.is_active == is_active)
            
        if search:
            query = query.where(Tour.name.ilike(f"%{search}%"))
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def create_with_owner(
        self, 
        db: AsyncSession, 
        *, 
        obj_in: TourCreate, 
        owner_id: Union[str, UUID]
    ) -> Tour:
        """Create a new tour for a specific owner.
        
        Args:
            db: Database session
            obj_in: Tour creation data
            owner_id: ID of the tour owner
            
        Returns:
            Tour: The created tour
        """
        db_obj = Tour(
            **obj_in.dict(exclude={"widget_config"}, exclude_unset=True),
            owner_id=owner_id,
            widget_config=obj_in.widget_config.dict() if obj_in.widget_config else None,
        )
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    
    async def update_with_owner(
        self,
        db: AsyncSession,
        *,
        db_obj: Tour,
        obj_in: Union[TourUpdate, Dict[str, Any]],
        owner_id: Optional[Union[str, UUID]] = None,
    ) -> Tour:
        """Update a tour, optionally verifying ownership.
        
        Args:
            db: Database session
            db_obj: The tour to update
            obj_in: Update data
            owner_id: Optional owner ID to verify
            
        Returns:
            Tour: The updated tour
            
        Raises:
            ValueError: If owner_id is provided and doesn't match the tour's owner
        """
        if owner_id is not None and str(db_obj.owner_id) != str(owner_id):
            raise ValueError("Not authorized to update this tour")
            
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        # Handle widget config update
        if "widget_config" in update_data:
            widget_config = update_data.pop("widget_config")
            if widget_config is not None:
                update_data["widget_config"] = widget_config.dict()
        
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    
    async def get_with_usage(
        self, 
        db: AsyncSession, 
        tour_id: Union[str, UUID],
        owner_id: Optional[Union[str, UUID]] = None
    ) -> Optional[Dict[str, Any]]:
        """Get a tour with its usage statistics.
        
        Args:
            db: Database session
            tour_id: Tour ID
            owner_id: Optional owner ID to verify
            
        Returns:
            Optional[Dict[str, Any]]: Tour with usage statistics if found, None otherwise
        """
        query = select(Tour).where(Tour.id == tour_id)
        
        if owner_id is not None:
            query = query.where(Tour.owner_id == owner_id)
            
        query = query.options(
            selectinload(Tour.owner),
            selectinload(Tour.leads),
            selectinload(Tour.usage_records),
        )
        
        result = await db.execute(query)
        tour = result.scalar_one_or_none()
        
        if not tour:
            return None
            
        # Calculate usage statistics
        usage_stats = await self._get_usage_stats(db, tour_id)
        
        # Convert to dict and add usage stats
        tour_dict = {
            **{c.name: getattr(tour, c.name) for c in tour.__table__.columns},
            **usage_stats,
            "owner": tour.owner,
            "lead_count": len(tour.leads),
        }
        
        return tour_dict
    
    async def _get_usage_stats(
        self, 
        db: AsyncSession, 
        tour_id: Union[str, UUID]
    ) -> Dict[str, Any]:
        """Get usage statistics for a tour.
        
        Args:
            db: Database session
            tour_id: Tour ID
            
        Returns:
            Dict[str, Any]: Usage statistics
        """
        from sqlalchemy import func, extract
        from datetime import datetime, timedelta
        
        # Get total usage
        total_query = select(
            func.sum(Usage.tts_seconds).label("total_tts_seconds"),
            func.sum(Usage.message_count).label("total_messages"),
            func.sum(Usage.api_call_count).label("total_api_calls"),
        ).where(Usage.tour_id == tour_id)
        
        total_result = (await db.execute(total_query)).one_or_none()
        
        # Get monthly usage
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        monthly_query = select(
            func.sum(Usage.tts_seconds).label("monthly_tts_seconds"),
            func.sum(Usage.message_count).label("monthly_messages"),
            func.sum(Usage.api_call_count).label("monthly_api_calls"),
        ).where(
            and_(
                Usage.tour_id == tour_id,
                Usage.created_at >= thirty_days_ago
            )
        )
        
        monthly_result = (await db.execute(monthly_query)).one_or_none()
        
        return {
            "total_tts_seconds": total_result[0] or 0 if total_result else 0,
            "total_messages": total_result[1] or 0 if total_result else 0,
            "total_api_calls": total_result[2] or 0 if total_result else 0,
            "monthly_tts_seconds": monthly_result[0] or 0 if monthly_result else 0,
            "monthly_messages": monthly_result[1] or 0 if monthly_result else 0,
            "monthly_api_calls": monthly_result[2] or 0 if monthly_result else 0,
        }
    
    async def get_with_leads(
        self, 
        db: AsyncSession, 
        tour_id: Union[str, UUID],
        owner_id: Optional[Union[str, UUID]] = None
    ) -> Optional[TourWithLeads]:
        """Get a tour with its leads.
        
        Args:
            db: Database session
            tour_id: Tour ID
            owner_id: Optional owner ID to verify
            
        Returns:
            Optional[TourWithLeads]: Tour with leads if found, None otherwise
        """
        query = select(Tour).where(Tour.id == tour_id)
        
        if owner_id is not None:
            query = query.where(Tour.owner_id == owner_id)
            
        query = query.options(
            selectinload(Tour.leads),
            selectinload(Tour.owner),
        )
        
        result = await db.execute(query)
        tour = result.scalar_one_or_none()
        
        if not tour:
            return None
            
        return TourWithLeads(
            **{c.name: getattr(tour, c.name) for c in tour.__table__.columns},
            leads=tour.leads,
            owner=tour.owner,
        )

# Create a singleton instance for easy importing
tour_repo = TourRepository()
