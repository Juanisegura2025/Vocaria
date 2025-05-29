"""
Leads API endpoints.

This module contains the FastAPI endpoints for managing leads.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from vocaria.core.config import settings
from vocaria.db.models import Lead, User, Tour
from vocaria.db.repositories.lead import lead_repo
from vocaria.services.lead import LeadService
from vocaria.schemas.lead import (
    LeadCreate,
    LeadUpdate,
    LeadInDB,
    LeadWithStats,
)

router = APIRouter()

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(lead_repo.get_db),
) -> User:
    """Get the current authenticated user.
    
    Args:
        token: The JWT token
        db: Database session
        
    Returns:
        User: The authenticated user
        
    Raises:
        HTTPException: If the token is invalid or the user is not found
    """
    auth_service = AuthService(db)
    return await auth_service.get_current_user(token)

@router.post("/", response_model=LeadInDB)
async def create_lead(
    lead: LeadCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lead_repo.get_db),
) -> Lead:
    """Create a new lead.
    
    Args:
        lead: Lead creation data
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Lead: The created lead
        
    Raises:
        HTTPException: If the lead cannot be created or the tour is not found
    """
    lead_service = LeadService(db)
    return await lead_service.create_lead(
        lead=lead,
        owner_id=current_user.id,
    )

@router.get("/", response_model=List[LeadInDB])
async def list_leads(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lead_repo.get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    tour_id: Optional[str] = None,
) -> List[Lead]:
    """List leads.
    
    Args:
        current_user: The authenticated user
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Optional lead status filter
        tour_id: Optional tour ID filter
        
    Returns:
        List[Lead]: List of leads
    """
    lead_service = LeadService(db)
    return await lead_service.list_leads(
        owner_id=current_user.id,
        status=status,
        tour_id=tour_id,
        skip=skip,
        limit=limit,
    )

@router.get("/{lead_id}", response_model=LeadWithStats)
async def get_lead(
    lead_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lead_repo.get_db),
) -> Lead:
    """Get a lead by ID.
    
    Args:
        lead_id: The lead ID
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Lead: The lead
        
    Raises:
        HTTPException: If the lead is not found or the user is not authorized
    """
    lead_service = LeadService(db)
    return await lead_service.get_lead(
        lead_id=lead_id,
        owner_id=current_user.id,
    )

@router.put("/{lead_id}", response_model=LeadInDB)
async def update_lead(
    lead_id: str,
    lead_update: LeadUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lead_repo.get_db),
) -> Lead:
    """Update a lead.
    
    Args:
        lead_id: The lead ID
        lead_update: Lead update data
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Lead: The updated lead
        
    Raises:
        HTTPException: If the lead is not found or the user is not authorized
    """
    lead_service = LeadService(db)
    return await lead_service.update_lead(
        lead_id=lead_id,
        lead_update=lead_update,
        owner_id=current_user.id,
    )

@router.delete("/{lead_id}", response_model=LeadInDB)
async def delete_lead(
    lead_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lead_repo.get_db),
) -> Lead:
    """Delete a lead.
    
    Args:
        lead_id: The lead ID
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Lead: The deleted lead
        
    Raises:
        HTTPException: If the lead is not found or the user is not authorized
    """
    lead_service = LeadService(db)
    return await lead_service.delete_lead(
        lead_id=lead_id,
        owner_id=current_user.id,
    )

@router.get("/{lead_id}/stats", response_model=Dict[str, Any])
async def get_lead_stats(
    lead_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lead_repo.get_db),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Dict[str, Any]:
    """Get lead statistics.
    
    Args:
        lead_id: The lead ID
        current_user: The authenticated user
        db: Database session
        start_date: Optional start date for statistics
        end_date: Optional end date for statistics
        
    Returns:
        Dict[str, Any]: Lead statistics
        
    Raises:
        HTTPException: If the lead is not found or the user is not authorized
    """
    lead_service = LeadService(db)
    return await lead_service.get_lead_stats(
        lead_id=lead_id,
        owner_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
    )
