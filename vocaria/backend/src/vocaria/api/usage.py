"""
Usage API endpoints.

This module contains the FastAPI endpoints for tracking and managing usage.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from vocaria.core.config import settings
from vocaria.db.models import User
from vocaria.db.repositories.user import user_repo
from vocaria.services.usage import UsageService
from vocaria.schemas.usage import (
    UsageStats,
    UsageLimits,
    UsageBreakdown,
)

router = APIRouter()

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(user_repo.get_db),
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

@router.get("/stats", response_model=UsageStats)
async def get_usage_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(user_repo.get_db),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> UsageStats:
    """Get usage statistics.
    
    Args:
        current_user: The authenticated user
        db: Database session
        start_date: Optional start date for statistics
        end_date: Optional end date for statistics
        
    Returns:
        UsageStats: Usage statistics
    """
    usage_service = UsageService(db)
    return await usage_service.get_usage_stats(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
    )

@router.get("/limits", response_model=UsageLimits)
async def get_usage_limits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(user_repo.get_db),
) -> UsageLimits:
    """Get usage limits.
    
    Args:
        current_user: The authenticated user
        db: Database session
        
    Returns:
        UsageLimits: Usage limits
    """
    usage_service = UsageService(db)
    return await usage_service.get_usage_limits(
        user_id=current_user.id,
    )

@router.get("/breakdown", response_model=UsageBreakdown)
async def get_usage_breakdown(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(user_repo.get_db),
    period: str = "month",
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> UsageBreakdown:
    """Get usage breakdown.
    
    Args:
        current_user: The authenticated user
        db: Database session
        period: Time period for breakdown (day, week, month, year)
        start_date: Optional start date for breakdown
        end_date: Optional end date for breakdown
        
    Returns:
        UsageBreakdown: Usage breakdown
    """
    usage_service = UsageService(db)
    return await usage_service.get_usage_breakdown(
        user_id=current_user.id,
        period=period,
        start_date=start_date,
        end_date=end_date,
    )

@router.get("/leaderboard", response_model=List[Dict[str, Any]])
async def get_usage_leaderboard(
    db: AsyncSession = Depends(user_repo.get_db),
    period: str = "month",
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """Get usage leaderboard.
    
    Args:
        db: Database session
        period: Time period for leaderboard (day, week, month, year)
        limit: Number of entries to return
        
    Returns:
        List[Dict[str, Any]]: List of leaderboard entries
    """
    usage_service = UsageService(db)
    return await usage_service.get_usage_leaderboard(
        period=period,
        limit=limit,
    )
