"""
Tour service for business logic related to property tours.

This module contains the TourService class which provides business logic
for managing property tours.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from vocaria.db.models import Tour, User
from vocaria.db.repositories.tour import tour_repo
from vocaria.db.repositories.usage import usage_repo
from vocaria.schemas.tour import (
    TourCreate, 
    TourUpdate, 
    TourWithLeads,
    TourWithUsage,
    TourWidgetConfig,
)
from vocaria.services.auth import get_current_active_user
from vocaria.services.integrations.matterport import MatterportService

class TourService:
    """Service for tour-related operations."""
    
    def __init__(self, db: AsyncSession, current_user: User):
        """Initialize the TourService.
        
        Args:
            db: Database session
            current_user: The currently authenticated user
        """
        self.db = db
        self.current_user = current_user
        self.matterport = MatterportService(db)
    
    async def create(self, tour_in: TourCreate) -> Tour:
        """Create a new tour.
        
        Args:
            tour_in: Tour creation data
            
        Returns:
            Tour: The created tour
            
        Raises:
            HTTPException: If the user has reached their tour limit
        """
        # Check if the user has reached their tour limit
        if not self.current_user.is_superuser:
            user_tours = await tour_repo.get_multi_by_owner(
                self.db, 
                owner_id=self.current_user.id,
                limit=1000  # Arbitrary high limit to get all tours
            )
            
            if len(user_tours) >= self.current_user.max_tours:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Maximum number of tours ({self.current_user.max_tours}) reached",
                )
        
        # Create the tour
        tour = await tour_repo.create_with_owner(
            self.db, 
            obj_in=tour_in, 
            owner_id=self.current_user.id
        )
        
        # Initialize Matterport integration if enabled
        if tour_in.widget_config and tour_in.widget_config.integrations.matterport:
            await self.matterport.initialize_tour(tour.id, tour_in.widget_config.integrations.matterport)
        
        return tour
    
    async def get(self, tour_id: Union[str, UUID]) -> Optional[TourWithUsage]:
        """Get a tour by ID with usage statistics.
        
        Args:
            tour_id: ID of the tour to retrieve
            
        Returns:
            Optional[TourWithUsage]: The tour with usage statistics if found, None otherwise
        """
        tour_data = await tour_repo.get_with_usage(
            self.db, 
            tour_id=tour_id,
            owner_id=self.current_user.id if not self.current_user.is_superuser else None
        )
        
        if not tour_data:
            return None
            
        return TourWithUsage(**tour_data)
    
    async def list(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """List tours with optional filtering.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            search: Search term to filter tours by name
            is_active: Filter by active status
            
        Returns:
            Dict[str, Any]: Dictionary containing the list of tours and total count
        """
        if self.current_user.is_superuser:
            # Superusers can see all tours
            tours, total = await tour_repo.get_multi(
                self.db,
                skip=skip,
                limit=limit,
                search=search,
                is_active=is_active,
            )
        else:
            # Regular users can only see their own tours
            tours, total = await tour_repo.get_multi_by_owner(
                self.db,
                owner_id=self.current_user.id,
                skip=skip,
                limit=limit,
                search=search,
                is_active=is_active,
            )
        
        # Get usage statistics for each tour
        tours_with_usage = []
        for tour in tours:
            tour_dict = {c.name: getattr(tour, c.name) for c in tour.__table__.columns}
            tour_dict["usage"] = await usage_repo.get_usage_for_tour(
                self.db,
                tour_id=tour.id,
                group_by="month"
            )
            tours_with_usage.append(tour_dict)
        
        return {
            "tours": tours_with_usage,
            "total": total,
            "skip": skip,
            "limit": limit,
        }
    
    async def update(
        self, 
        tour_id: Union[str, UUID], 
        tour_in: TourUpdate
    ) -> Optional[Tour]:
        """Update a tour.
        
        Args:
            tour_id: ID of the tour to update
            tour_in: Tour update data
            
        Returns:
            Optional[Tour]: The updated tour if found and authorized, None otherwise
        """
        # Get the existing tour
        tour = await tour_repo.get(
            self.db, 
            id=tour_id,
            options=[selectinload(Tour.widget_config)]
        )
        
        if not tour:
            return None
            
        # Check if the user is the owner or a superuser
        if not self.current_user.is_superuser and str(tour.owner_id) != str(self.current_user.id):
            return None
        
        # Handle Matterport integration updates
        if tour_in.widget_config and tour_in.widget_config.integrations.matterport:
            current_matterport = tour.widget_config.integrations.matterport if tour.widget_config else None
            new_matterport = tour_in.widget_config.integrations.matterport
            
            # Initialize or update Matterport integration if needed
            if not current_matterport or current_matterport.model_id != new_matterport.model_id:
                await self.matterport.initialize_tour(tour_id, new_matterport)
        
        # Update the tour
        updated_tour = await tour_repo.update(
            self.db,
            db_obj=tour,
            obj_in=tour_in,
        )
        
        return updated_tour
    
    async def delete(self, tour_id: Union[str, UUID]) -> bool:
        """Delete a tour.
        
        Args:
            tour_id: ID of the tour to delete
            
        Returns:
            bool: True if the tour was deleted, False otherwise
        """
        # Get the tour
        tour = await tour_repo.get(self.db, id=tour_id)
        
        if not tour:
            return False
            
        # Check if the user is the owner or a superuser
        if not self.current_user.is_superuser and str(tour.owner_id) != str(self.current_user.id):
            return False
        
        # Delete the tour
        await tour_repo.remove(self.db, id=tour_id)
        
        # Clean up any external resources
        await self.matterport.cleanup_tour(tour_id)
        
        return True
    
    async def get_widget_config(self, tour_id: Union[str, UUID]) -> Optional[TourWidgetConfig]:
        """Get the widget configuration for a tour.
        
        Args:
            tour_id: ID of the tour
            
        Returns:
            Optional[TourWidgetConfig]: The widget configuration if found, None otherwise
        """
        tour = await tour_repo.get(
            self.db, 
            id=tour_id,
            options=[selectinload(Tour.widget_config)]
        )
        
        if not tour or not tour.widget_config:
            return None
            
        return TourWidgetConfig(**tour.widget_config)
    
    async def get_analytics(
        self,
        tour_id: Union[str, UUID],
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Get analytics for a tour.
        
        Args:
            tour_id: ID of the tour
            start_date: Start date for the analytics
            end_date: End date for the analytics
            
        Returns:
            Dict[str, Any]: Analytics data
        """
        # Get the tour to verify ownership
        tour = await tour_repo.get(self.db, id=tour_id)
        
        if not tour or (not self.current_user.is_superuser and str(tour.owner_id) != str(self.current_user.id)):
            return {}
        
        # Set default date range if not provided
        if end_date is None:
            end_date = datetime.utcnow()
        if start_date is None:
            start_date = end_date - timedelta(days=30)
        
        # Get usage data
        usage_data = await usage_repo.get_usage_for_tour(
            self.db,
            tour_id=tour_id,
            start_date=start_date,
            end_date=end_date,
            group_by="day"
        )
        
        # Get lead statistics
        from vocaria.db.repositories.lead import lead_repo
        leads, total_leads = await lead_repo.get_multi_by_tour(
            self.db,
            tour_id=tour_id,
            start_date=start_date,
            end_date=end_date,
        )
        
        # Calculate lead status distribution
        status_distribution = {}
        if leads:
            for lead in leads:
                status = lead.status.value if hasattr(lead.status, 'value') else str(lead.status)
                status_distribution[status] = status_distribution.get(status, 0) + 1
        
        # Get conversation statistics
        from vocaria.db.repositories.conversation import conversation_repo
        conversations, total_conversations = await conversation_repo.get_multi_by_tour(
            self.db,
            tour_id=tour_id,
            start_date=start_date,
            end_date=end_date,
        )
        
        # Calculate average messages per conversation
        avg_messages = 0
        if conversations:
            total_messages = sum(len(conv.messages) for conv in conversations)
            avg_messages = total_messages / len(conversations) if conversations else 0
        
        return {
            "tour_id": str(tour_id),
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            },
            "usage": usage_data,
            "leads": {
                "total": total_leads,
                "status_distribution": status_distribution,
            },
            "conversations": {
                "total": total_conversations,
                "avg_messages_per_conversation": round(avg_messages, 2),
            },
        }

# Dependency to get the tour service
def get_tour_service(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TourService:
    """Get an instance of the tour service.
    
    Args:
        db: Database session
        current_user: The currently authenticated user
        
    Returns:
        TourService: An instance of the tour service
    """
    return TourService(db, current_user)
