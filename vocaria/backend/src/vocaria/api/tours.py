"""
Tours API endpoints.

This module contains the FastAPI endpoints for managing tours.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from vocaria.core.config import settings
from vocaria.db.models import Tour, User
from vocaria.db.repositories.tour import tour_repo
from vocaria.services.tour import TourService
from vocaria.schemas.tour import (
    TourCreate,
    TourUpdate,
    TourInDB,
    TourWithStats,
)

router = APIRouter()

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(tour_repo.get_db),
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

@router.post("/", response_model=TourInDB)
async def create_tour(
    tour: TourCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(tour_repo.get_db),
) -> Tour:
    """Create a new tour.
    
    Args:
        tour: Tour creation data
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Tour: The created tour
        
    Raises:
        HTTPException: If the tour cannot be created
    """
    tour_service = TourService(db)
    return await tour_service.create_tour(
        tour=tour,
        owner_id=current_user.id,
    )

@router.get("/", response_model=List[TourInDB])
async def list_tours(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(tour_repo.get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
) -> List[Tour]:
    """List tours.
    
    Args:
        current_user: The authenticated user
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Optional tour status filter
        
    Returns:
        List[Tour]: List of tours
    """
    tour_service = TourService(db)
    return await tour_service.list_tours(
        owner_id=current_user.id,
        status=status,
        skip=skip,
        limit=limit,
    )

@router.get("/{tour_id}", response_model=TourWithStats)
async def get_tour(
    tour_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(tour_repo.get_db),
) -> Tour:
    """Get a tour by ID.
    
    Args:
        tour_id: The tour ID
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Tour: The tour
        
    Raises:
        HTTPException: If the tour is not found or the user is not authorized
    """
    tour_service = TourService(db)
    return await tour_service.get_tour(
        tour_id=tour_id,
        owner_id=current_user.id,
    )

@router.put("/{tour_id}", response_model=TourInDB)
async def update_tour(
    tour_id: str,
    tour_update: TourUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(tour_repo.get_db),
) -> Tour:
    """Update a tour.
    
    Args:
        tour_id: The tour ID
        tour_update: Tour update data
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Tour: The updated tour
        
    Raises:
        HTTPException: If the tour is not found or the user is not authorized
    """
    tour_service = TourService(db)
    return await tour_service.update_tour(
        tour_id=tour_id,
        tour_update=tour_update,
        owner_id=current_user.id,
    )

@router.delete("/{tour_id}", response_model=TourInDB)
async def delete_tour(
    tour_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(tour_repo.get_db),
) -> Tour:
    """Delete a tour.
    
    Args:
        tour_id: The tour ID
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Tour: The deleted tour
        
    Raises:
        HTTPException: If the tour is not found or the user is not authorized
    """
    tour_service = TourService(db)
    return await tour_service.delete_tour(
        tour_id=tour_id,
        owner_id=current_user.id,
    )

@router.get("/{tour_id}/stats", response_model=Dict[str, Any])
async def get_tour_stats(
    tour_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(tour_repo.get_db),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Dict[str, Any]:
    """Get tour statistics.
    
    Args:
        tour_id: The tour ID
        current_user: The authenticated user
        db: Database session
        start_date: Optional start date for statistics
        end_date: Optional end date for statistics
        
    Returns:
        Dict[str, Any]: Tour statistics
        
    Raises:
        HTTPException: If the tour is not found or the user is not authorized
    """
    tour_service = TourService(db)
    return await tour_service.get_tour_stats(
        tour_id=tour_id,
        owner_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
    )
