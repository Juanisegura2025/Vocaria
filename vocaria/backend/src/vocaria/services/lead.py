"""
Lead service for business logic related to leads.

This module contains the LeadService class which provides business logic
for managing leads in the system.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple
from uuid import UUID

from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from vocaria.db.models import Lead, Tour, User, Conversation, Message
from vocaria.db.repositories.lead import lead_repo
from vocaria.db.repositories.tour import tour_repo
from vocaria.db.repositories.conversation import conversation_repo
from vocaria.schemas.lead import (
    LeadCreate, 
    LeadUpdate, 
    LeadStatus,
    LeadNoteCreate,
    LeadWithConversations,
)
from vocaria.services.auth import get_current_active_user

class LeadService:
    """Service for lead-related operations."""
    
    def __init__(self, db: AsyncSession, current_user: User):
        """Initialize the LeadService.
        
        Args:
            db: Database session
            current_user: The currently authenticated user
        """
        self.db = db
        self.current_user = current_user
    
    async def create(self, tour_id: Union[str, UUID], lead_in: LeadCreate) -> Lead:
        """Create a new lead for a tour.
        
        Args:
            tour_id: ID of the tour to add the lead to
            lead_in: Lead creation data
            
        Returns:
            Lead: The created lead
            
        Raises:
            HTTPException: If the tour is not found or the user is not authorized
        """
        # Verify the tour exists and the user has access to it
        tour = await tour_repo.get(self.db, id=tour_id)
        if not tour:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tour not found",
            )
            
        if not self.current_user.is_superuser and str(tour.owner_id) != str(self.current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to add leads to this tour",
            )
        
        # Check if the lead already exists (by email or phone)
        existing_lead = None
        if lead_in.email:
            existing_lead = await lead_repo.get_by_email(self.db, lead_in.email, tour_id=tour_id)
        elif lead_in.phone:
            existing_lead = await lead_repo.get_by_phone(self.db, lead_in.phone, tour_id=tour_id)
        
        if existing_lead:
            # Update the existing lead instead of creating a new one
            return await self.update(existing_lead.id, LeadUpdate(**lead_in.dict()))
        
        # Create the lead
        lead = await lead_repo.create_with_tour(
            self.db, 
            obj_in=lead_in, 
            tour_id=tour_id
        )
        
        return lead
    
    async def get(self, lead_id: Union[str, UUID]) -> Optional[LeadWithConversations]:
        """Get a lead by ID with conversations.
        
        Args:
            lead_id: ID of the lead to retrieve
            
        Returns:
            Optional[LeadWithConversations]: The lead with conversations if found and authorized, None otherwise
        """
        lead = await lead_repo.get_with_conversations(
            self.db, 
            lead_id=lead_id,
            tour_owner_id=None if self.current_user.is_superuser else self.current_user.id
        )
        
        if not lead:
            return None
            
        return LeadWithConversations(**lead)
    
    async def list(
        self,
        tour_id: Optional[Union[str, UUID]] = None,
        skip: int = 0,
        limit: int = 100,
        status: Optional[Union[LeadStatus, List[LeadStatus]]] = None,
        search: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """List leads with optional filtering.
        
        Args:
            tour_id: Optional ID of the tour to filter by
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Filter by lead status (single status or list of statuses)
            search: Search term to filter leads by name, email, or phone
            start_date: Filter leads created after this date
            end_date: Filter leads created before this date
            
        Returns:
            Dict[str, Any]: Dictionary containing the list of leads and total count
        """
        if tour_id:
            # Get leads for a specific tour
            tour = await tour_repo.get(self.db, id=tour_id)
            
            if not tour or (not self.current_user.is_superuser and str(tour.owner_id) != str(self.current_user.id)):
                return {"items": [], "total": 0, "skip": skip, "limit": limit}
                
            leads, total = await lead_repo.get_multi_by_tour(
                self.db,
                tour_id=tour_id,
                skip=skip,
                limit=limit,
                status=status,
                search=search,
                start_date=start_date,
                end_date=end_date,
            )
        else:
            # Get all leads for the current user's tours
            if self.current_user.is_superuser:
                # Superusers can see all leads
                leads, total = await lead_repo.get_multi(
                    self.db,
                    skip=skip,
                    limit=limit,
                    status=status,
                    search=search,
                    start_date=start_date,
                    end_date=end_date,
                )
            else:
                # Regular users can only see leads from their own tours
                leads, total = await lead_repo.get_multi_by_owner(
                    self.db,
                    owner_id=self.current_user.id,
                    skip=skip,
                    limit=limit,
                    status=status,
                    search=search,
                    start_date=start_date,
                    end_date=end_date,
                )
        
        return {
            "items": leads,
            "total": total,
            "skip": skip,
            "limit": limit,
        }
    
    async def update(
        self, 
        lead_id: Union[str, UUID], 
        lead_in: LeadUpdate
    ) -> Optional[Lead]:
        """Update a lead.
        
        Args:
            lead_id: ID of the lead to update
            lead_in: Lead update data
            
        Returns:
            Optional[Lead]: The updated lead if found and authorized, None otherwise
        """
        # Get the existing lead
        lead = await lead_repo.get(self.db, id=lead_id)
        
        if not lead:
            return None
            
        # Verify the user has access to this lead's tour
        tour = await tour_repo.get(self.db, id=lead.tour_id)
        if not tour or (not self.current_user.is_superuser and str(tour.owner_id) != str(self.current_user.id)):
            return None
        
        # Update the lead
        updated_lead = await lead_repo.update(
            self.db,
            db_obj=lead,
            obj_in=lead_in,
        )
        
        return updated_lead
    
    async def update_status(
        self, 
        lead_id: Union[str, UUID], 
        status: LeadStatus
    ) -> Optional[Lead]:
        """Update a lead's status.
        
        Args:
            lead_id: ID of the lead to update
            status: New status
            
        Returns:
            Optional[Lead]: The updated lead if found and authorized, None otherwise
        """
        # Get the existing lead
        lead = await lead_repo.get(self.db, id=lead_id)
        
        if not lead:
            return None
            
        # Verify the user has access to this lead's tour
        tour = await tour_repo.get(self.db, id=lead.tour_id)
        if not tour or (not self.current_user.is_superuser and str(tour.owner_id) != str(self.current_user.id)):
            return None
        
        # Update the status
        updated_lead = await lead_repo.update_status(
            self.db,
            lead_id=lead_id,
            status=status,
            tour_owner_id=None if self.current_user.is_superuser else self.current_user.id
        )
        
        return updated_lead
    
    async def add_note(
        self,
        lead_id: Union[str, UUID],
        note_in: LeadNoteCreate,
    ) -> Optional[Dict[str, Any]]:
        """Add a note to a lead.
        
        Args:
            lead_id: ID of the lead to add the note to
            note_in: Note data
            
        Returns:
            Optional[Dict[str, Any]]: The created note if successful, None otherwise
        """
        # Get the existing lead
        lead = await lead_repo.get(self.db, id=lead_id)
        
        if not lead:
            return None
            
        # Verify the user has access to this lead's tour
        tour = await tour_repo.get(self.db, id=lead.tour_id)
        if not tour or (not self.current_user.is_superuser and str(tour.owner_id) != str(self.current_user.id)):
            return None
        
        # Add the note
        note = await lead_repo.add_note(
            self.db,
            lead_id=lead_id,
            note_in=note_in,
            author_id=self.current_user.id,
        )
        
        return note
    
    async def get_notes(
        self,
        lead_id: Union[str, UUID],
        skip: int = 0,
        limit: int = 100,
    ) -> Dict[str, Any]:
        """Get notes for a lead.
        
        Args:
            lead_id: ID of the lead
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            Dict[str, Any]: Dictionary containing the list of notes and total count
        """
        # Get the lead to verify access
        lead = await lead_repo.get(self.db, id=lead_id)
        if not lead:
            return {"items": [], "total": 0, "skip": skip, "limit": limit}
            
        # Verify the user has access to this lead's tour
        tour = await tour_repo.get(self.db, id=lead.tour_id)
        if not tour or (not self.current_user.is_superuser and str(tour.owner_id) != str(self.current_user.id)):
            return {"items": [], "total": 0, "skip": skip, "limit": limit}
        
        # Get the notes
        notes, total = await lead_repo.get_notes(
            self.db,
            lead_id=lead_id,
            skip=skip,
            limit=limit,
        )
        
        return {
            "items": notes,
            "total": total,
            "skip": skip,
            "limit": limit,
        }
    
    async def get_conversations(
        self,
        lead_id: Union[str, UUID],
        skip: int = 0,
        limit: int = 100,
    ) -> Dict[str, Any]:
        """Get conversations for a lead.
        
        Args:
            lead_id: ID of the lead
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            Dict[str, Any]: Dictionary containing the list of conversations and total count
        """
        # Get the lead to verify access
        lead = await lead_repo.get(self.db, id=lead_id)
        if not lead:
            return {"items": [], "total": 0, "skip": skip, "limit": limit}
            
        # Verify the user has access to this lead's tour
        tour = await tour_repo.get(self.db, id=lead.tour_id)
        if not tour or (not self.current_user.is_superuser and str(tour.owner_id) != str(self.current_user.id)):
            return {"items": [], "total": 0, "skip": skip, "limit": limit}
        
        # Get the conversations
        conversations, total = await conversation_repo.get_multi_by_lead(
            self.db,
            lead_id=lead_id,
            skip=skip,
            limit=limit,
        )
        
        return {
            "items": conversations,
            "total": total,
            "skip": skip,
            "limit": limit,
        }

# Dependency to get the lead service
def get_lead_service(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> LeadService:
    """Get an instance of the lead service.
    
    Args:
        db: Database session
        current_user: The currently authenticated user
        
    Returns:
        LeadService: An instance of the lead service
    """
    return LeadService(db, current_user)
