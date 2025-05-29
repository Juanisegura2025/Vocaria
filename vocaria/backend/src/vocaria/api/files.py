"""
Files API endpoints.

This module contains the FastAPI endpoints for managing files.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from vocaria.core.config import settings
from vocaria.db.models import File, User
from vocaria.db.repositories.file import file_repo
from vocaria.services.file import FileService
from vocaria.schemas.file import (
    FileCreate,
    FileUpdate,
    FileInDB,
    FileUploadResponse,
    FileDownloadResponse,
)

router = APIRouter()

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(file_repo.get_db),
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

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    owner_id: str = Depends(get_current_user),
    related_id: Optional[str] = None,
    related_type: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    db: AsyncSession = Depends(file_repo.get_db),
) -> FileUploadResponse:
    """Upload a file.
    
    Args:
        file: The file to upload
        owner_id: The ID of the file owner
        related_id: Optional ID of the related resource
        related_type: Optional type of the related resource
        metadata: Optional additional metadata
        db: Database session
        
    Returns:
        FileUploadResponse: Response containing the uploaded file information
        
    Raises:
        HTTPException: If the file cannot be uploaded
    """
    file_service = FileService(db)
    return await file_service.upload_file(
        file=file.file,
        filename=file.filename,
        content_type=file.content_type,
        owner_id=owner_id,
        related_id=related_id,
        related_type=related_type,
        metadata=metadata,
    )

@router.get("/download/{file_id}", response_model=FileDownloadResponse)
async def download_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(file_repo.get_db),
) -> FileDownloadResponse:
    """Download a file.
    
    Args:
        file_id: The ID of the file to download
        current_user: The authenticated user
        db: Database session
        
    Returns:
        FileDownloadResponse: Response containing the download information
        
    Raises:
        HTTPException: If the file is not found or the user is not authorized
    """
    file_service = FileService(db)
    return await file_service.download_file(
        file_id=file_id,
        owner_id=current_user.id,
    )

@router.get("/{file_id}", response_model=FileInDB)
async def get_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(file_repo.get_db),
) -> File:
    """Get file information.
    
    Args:
        file_id: The ID of the file to get
        current_user: The authenticated user
        db: Database session
        
    Returns:
        File: The file information
        
    Raises:
        HTTPException: If the file is not found or the user is not authorized
    """
    file_service = FileService(db)
    return await file_service.get_file(
        file_id=file_id,
        owner_id=current_user.id,
    )

@router.get("/list", response_model=List[FileInDB])
async def list_files(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(file_repo.get_db),
    related_id: Optional[str] = None,
    related_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[File]:
    """List files.
    
    Args:
        current_user: The authenticated user
        db: Database session
        related_id: Optional ID of the related resource
        related_type: Optional type of the related resource
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List[File]: List of files
    """
    file_service = FileService(db)
    return await file_service.list_files(
        owner_id=current_user.id,
        related_id=related_id,
        related_type=related_type,
        skip=skip,
        limit=limit,
    )

@router.put("/{file_id}", response_model=FileInDB)
async def update_file(
    file_id: str,
    file_update: FileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(file_repo.get_db),
) -> File:
    """Update a file.
    
    Args:
        file_id: The ID of the file to update
        file_update: File update data
        current_user: The authenticated user
        db: Database session
        
    Returns:
        File: The updated file
        
    Raises:
        HTTPException: If the file is not found or the user is not authorized
    """
    file_service = FileService(db)
    return await file_service.update_file(
        file_id=file_id,
        file_update=file_update,
        owner_id=current_user.id,
    )

@router.delete("/{file_id}", response_model=FileInDB)
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(file_repo.get_db),
) -> File:
    """Delete a file.
    
    Args:
        file_id: The ID of the file to delete
        current_user: The authenticated user
        db: Database session
        
    Returns:
        File: The deleted file
        
    Raises:
        HTTPException: If the file is not found or the user is not authorized
    """
    file_service = FileService(db)
    return await file_service.delete_file(
        file_id=file_id,
        owner_id=current_user.id,
    )
