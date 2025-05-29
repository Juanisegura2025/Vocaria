"""
Search API endpoints.

This module contains the FastAPI endpoints for searching across different content types.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from vocaria.core.config import settings
from vocaria.db.models import User
from vocaria.db.repositories.user import user_repo
from vocaria.services.search import SearchService
from vocaria.schemas.search import (
    SearchQuery,
    SearchResults,
    SearchType,
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

@router.post("/", response_model=SearchResults)
async def search(
    query: SearchQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(user_repo.get_db),
) -> SearchResults:
    """Search across different content types.
    
    Args:
        query: The search query parameters
        current_user: The authenticated user
        db: Database session
        
    Returns:
        SearchResults: The search results
        
    Raises:
        HTTPException: If there's an error performing the search
    """
    search_service = SearchService(db)
    return await search_service.search(
        query=query,
    )

@router.post("/tours", response_model=SearchResults)
async def search_tours(
    query: SearchQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(user_repo.get_db),
) -> SearchResults:
    """Search tours.
    
    Args:
        query: The search query parameters
        current_user: The authenticated user
        db: Database session
        
    Returns:
        SearchResults: The tour search results
        
    Raises:
        HTTPException: If there's an error performing the search
    """
    query.types = ["tour"]
    search_service = SearchService(db)
    return await search_service.search(
        query=query,
    )

@router.post("/leads", response_model=SearchResults)
async def search_leads(
    query: SearchQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(user_repo.get_db),
) -> SearchResults:
    """Search leads.
    
    Args:
        query: The search query parameters
        current_user: The authenticated user
        db: Database session
        
    Returns:
        SearchResults: The lead search results
        
    Raises:
        HTTPException: If there's an error performing the search
    """
    query.types = ["lead"]
    search_service = SearchService(db)
    return await search_service.search(
        query=query,
    )

@router.post("/conversations", response_model=SearchResults)
async def search_conversations(
    query: SearchQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(user_repo.get_db),
) -> SearchResults:
    """Search conversations.
    
    Args:
        query: The search query parameters
        current_user: The authenticated user
        db: Database session
        
    Returns:
        SearchResults: The conversation search results
        
    Raises:
        HTTPException: If there's an error performing the search
    """
    query.types = ["conversation", "message"]
    search_service = SearchService(db)
    return await search_service.search(
        query=query,
    )

@router.post("/files", response_model=SearchResults)
async def search_files(
    query: SearchQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(user_repo.get_db),
) -> SearchResults:
    """Search files.
    
    Args:
        query: The search query parameters
        current_user: The authenticated user
        db: Database session
        
    Returns:
        SearchResults: The file search results
        
    Raises:
        HTTPException: If there's an error performing the search
    """
    query.types = ["file"]
    search_service = SearchService(db)
    return await search_service.search(
        query=query,
    )
