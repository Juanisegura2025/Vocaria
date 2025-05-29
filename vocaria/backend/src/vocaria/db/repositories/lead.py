"""
Lead repository for database operations.

This module contains the LeadRepository class which provides methods for
interacting with the leads table in the database.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union
from uuid import UUID

from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from vocaria.db.models import Lead, Tour, Conversation
from vocaria.schemas.lead import LeadCreate, LeadUpdate, LeadStatus
from .base import BaseRepository

class LeadRepository(BaseRepository[Lead, LeadCreate, LeadUpdate]):
    """Repository for Lead model with custom methods."""
    
    def __init__(self):
        """Initialize the LeadRepository with the Lead model."""
        super().__init__(Lead)
    
    async def get_with_tour(
        self, 
        db: AsyncSession, 
        lead_id: Union[str, UUID],
        owner_id: Optional[Union[str, UUID]] = None
    ) -> Optional[Lead]:
        """Get a lead by ID with its associated tour.
        
        Args:
            db: Database session
            lead_id: ID of the lead to retrieve
            owner_id: Optional owner ID to verify tour ownership
            
        Returns:
            Optional[Lead]: The lead if found and authorized, None otherwise
        """
        query = select(Lead).where(Lead.id == lead_id)
        
        if owner_id is not None:
            query = query.join(Tour).where(Tour.owner_id == owner_id)
            
        query = query.options(selectinload(Lead.tour))
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_multi_by_tour(
        self,
        db: AsyncSession,
        tour_id: Union[str, UUID],
        *,
        skip: int = 0,
        limit: int = 100,
        status: Optional[LeadStatus] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Lead], int]:
        """Get multiple leads for a specific tour with pagination and filtering.
        
        Args:
            db: Database session
            tour_id: ID of the tour to get leads for
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Filter by lead status
            search: Search term to filter leads by name, email, or phone
            
        Returns:
            Tuple containing the list of leads and total count
        """
        # Base query
        query = select(Lead).where(Lead.tour_id == tour_id)
        count_query = select(func.count()).select_from(Lead).where(Lead.tour_id == tour_id)
        
        # Apply filters
        if status is not None:
            query = query.where(Lead.status == status)
            count_query = count_query.where(Lead.status == status)
            
        if search:
            search_filter = or_(
                Lead.first_name.ilike(f"%{search}%"),
                Lead.last_name.ilike(f"%{search}%"),
                Lead.email.ilike(f"%{search}%"),
                Lead.phone.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)
        
        # Get total count
        total = (await db.execute(count_query)).scalar_one()
        
        # Apply pagination and ordering
        leads = (
            await db.execute(
                query.order_by(Lead.created_at.desc())
                .offset(skip)
                .limit(limit)
                .options(selectinload(Lead.tour))
            )
        ).scalars().all()
        
        return leads, total
    
    async def update_status(
        self, 
        db: AsyncSession, 
        lead_id: Union[str, UUID], 
        status: LeadStatus,
        owner_id: Optional[Union[str, UUID]] = None
    ) -> Optional[Lead]:
        """Update a lead's status.
        
        Args:
            db: Database session
            lead_id: ID of the lead to update
            status: New status
            owner_id: Optional owner ID to verify tour ownership
            
        Returns:
            Optional[Lead]: The updated lead if found and authorized, None otherwise
        """
        query = update(Lead).where(Lead.id == lead_id).values(status=status)
        
        if owner_id is not None:
            query = query.where(
                Lead.id.in_(
                    select(Lead.id)
                    .join(Tour)
                    .where(and_(
                        Lead.id == lead_id,
                        Tour.owner_id == owner_id
                    ))
                )
            )
        
        query = query.returning(Lead)
        
        result = await db.execute(query)
        lead = result.scalar_one_or_none()
        
        if lead:
            await db.commit()
            await db.refresh(lead)
            
        return lead
    
    async def get_conversation_count(
        self, 
        db: AsyncSession, 
        lead_id: Union[str, UUID]
    ) -> int:
        """Get the number of conversations for a lead.
        
        Args:
            db: Database session
            lead_id: ID of the lead
            
        Returns:
            int: Number of conversations
        """
        query = select(func.count()).select_from(Conversation).where(
            Conversation.lead_id == lead_id
        )
        
        result = await db.execute(query)
        return result.scalar_one()
    
    async def get_recent_leads(
        self,
        db: AsyncSession,
        owner_id: Union[str, UUID],
        days: int = 30,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent leads with their conversation counts.
        
        Args:
            db: Database session
            owner_id: ID of the owner
            days: Number of days to look back
            limit: Maximum number of leads to return
            
        Returns:
            List[Dict[str, Any]]: List of leads with conversation counts
        """
        # Get the date X days ago
        days_ago = datetime.utcnow() - datetime.timedelta(days=days)
        
        # Subquery to count conversations per lead
        conversation_count = (
            select(
                Conversation.lead_id,
                func.count(Conversation.id).label('conversation_count')
            )
            .where(Conversation.created_at >= days_ago)
            .group_by(Conversation.lead_id)
            .subquery()
        )
        
        # Main query to get leads with conversation counts
        query = (
            select(
                Lead,
                func.coalesce(conversation_count.c.conversation_count, 0).label('conversation_count')
            )
            .join(Tour, Tour.id == Lead.tour_id)
            .outerjoin(
                conversation_count,
                conversation_count.c.lead_id == Lead.id
            )
            .where(and_(
                Tour.owner_id == owner_id,
                Lead.created_at >= days_ago
            ))
            .order_by(Lead.created_at.desc())
            .limit(limit)
        )
        
        result = await db.execute(query)
        
        return [
            {
                **dict(lead.__dict__),
                'conversation_count': count
            }
            for lead, count in result.all()
        ]

# Create a singleton instance for easy importing
lead_repo = LeadRepository()
