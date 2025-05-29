"""
Main API router for version 1 of the Vocaria API.

This module sets up the main FastAPI router and includes all API endpoints.
"""
from fastapi import APIRouter

from vocaria.api.v1.endpoints import auth, users, tours, leads, usage, conversations, files, search

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(tours.router, prefix="/tours", tags=["Tours"])
api_router.include_router(leads.router, prefix="/leads", tags=["Leads"])
api_router.include_router(usage.router, prefix="/usage", tags=["Usage"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["Conversations"])
api_router.include_router(files.router, prefix="/files", tags=["Files"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
