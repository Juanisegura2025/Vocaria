"""
File service for handling file operations.

This module contains the FileService class which provides business logic
for managing file uploads, downloads, and storage operations.
"""
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from vocaria.core.config import settings
from vocaria.db.models import File, User, Tour, Lead, Conversation, Message
from vocaria.db.repositories.file import file_repo
from vocaria.schemas.file import (
    FileCreate,
    FileUpdate,
    FileWithPresignedUrl,
    FileUploadResponse,
    FileDownloadResponse,
)

logger = logging.getLogger(__name__)

class FileService:
    """Service for file operations."""
    
    def __init__(self, db: AsyncSession):
        """Initialize the FileService.
        
        Args:
            db: Database session
        """
        self.db = db
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        
    async def upload_file(
        self,
        file: bytes,
        filename: str,
        content_type: str,
        owner_id: Union[str, UUID],
        related_id: Optional[Union[str, UUID]] = None,
        related_type: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> FileUploadResponse:
        """Upload a file to storage.
        
        Args:
            file: The file data to upload
            filename: The original filename
            content_type: The content type of the file
            owner_id: ID of the user who owns the file
            related_id: ID of the related resource (optional)
            related_type: Type of the related resource (optional)
            metadata: Additional metadata for the file (optional)
            
        Returns:
            FileUploadResponse: Response containing the uploaded file information
            
        Raises:
            HTTPException: If there's an error uploading the file
        """
        try:
            # Generate a unique filename
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            file_extension = os.path.splitext(filename)[1]
            unique_filename = f"{timestamp}_{str(owner_id)}{file_extension}"
            
            # Create the file record first
            file_record = await file_repo.create(
                self.db,
                obj_in=FileCreate(
                    filename=filename,
                    unique_filename=unique_filename,
                    content_type=content_type,
                    owner_id=str(owner_id),
                    related_id=str(related_id) if related_id else None,
                    related_type=related_type,
                    metadata=metadata or {},
                ),
            )
            
            # Upload to S3
            try:
                self.s3_client.upload_fileobj(
                    file,
                    settings.AWS_S3_BUCKET,
                    unique_filename,
                    ExtraArgs={
                        'ContentType': content_type,
                        'Metadata': {
                            'original_filename': filename,
                            'owner_id': str(owner_id),
                            **(metadata or {}),
                        },
                    },
                )
                
            except ClientError as e:
                logger.error(
                    f"Error uploading file to S3: {str(e)}",
                    exc_info=True,
                    extra={
                        "filename": filename,
                        "owner_id": str(owner_id),
                    },
                )
                
                # Delete the file record since upload failed
                await file_repo.delete(self.db, id=file_record.id)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error uploading file: {str(e)}",
                )
            
            # Generate a presigned URL for the uploaded file
            presigned_url = self._generate_presigned_url(unique_filename)
            
            return FileUploadResponse(
                file=file_record,
                presigned_url=presigned_url,
            )
            
        except Exception as e:
            logger.error(
                f"Error uploading file: {str(e)}",
                exc_info=True,
                extra={
                    "filename": filename,
                    "owner_id": str(owner_id),
                },
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error uploading file: {str(e)}",
            )
    
    async def download_file(
        self,
        file_id: Union[str, UUID],
        owner_id: Union[str, UUID],
    ) -> FileDownloadResponse:
        """Download a file.
        
        Args:
            file_id: ID of the file to download
            owner_id: ID of the user who owns the file
            
        Returns:
            FileDownloadResponse: Response containing the download information
            
        Raises:
            HTTPException: If the file is not found or the user is not authorized
        """
        try:
            # Get the file record
            file = await file_repo.get(
                self.db,
                id=file_id,
                options=[
                    selectinload(File.owner),
                ],
            )
            
            if not file:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="File not found",
                )
            
            # Verify ownership
            if str(file.owner_id) != str(owner_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to download this file",
                )
            
            # Generate a presigned URL for download
            presigned_url = self._generate_presigned_url(file.unique_filename)
            
            return FileDownloadResponse(
                file=file,
                presigned_url=presigned_url,
            )
            
        except Exception as e:
            logger.error(
                f"Error downloading file: {str(e)}",
                exc_info=True,
                extra={
                    "file_id": str(file_id),
                    "owner_id": str(owner_id),
                },
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error downloading file: {str(e)}",
            )
    
    async def get_file(
        self,
        file_id: Union[str, UUID],
        owner_id: Union[str, UUID],
    ) -> FileWithPresignedUrl:
        """Get file information with a presigned URL.
        
        Args:
            file_id: ID of the file to get
            owner_id: ID of the user who owns the file
            
        Returns:
            FileWithPresignedUrl: The file information with a presigned URL
            
        Raises:
            HTTPException: If the file is not found or the user is not authorized
        """
        try:
            # Get the file record
            file = await file_repo.get(
                self.db,
                id=file_id,
                options=[
                    selectinload(File.owner),
                ],
            )
            
            if not file:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="File not found",
                )
            
            # Verify ownership
            if str(file.owner_id) != str(owner_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to access this file",
                )
            
            # Generate a presigned URL
            presigned_url = self._generate_presigned_url(file.unique_filename)
            
            return FileWithPresignedUrl(
                **file.dict(),
                presigned_url=presigned_url,
            )
            
        except Exception as e:
            logger.error(
                f"Error getting file: {str(e)}",
                exc_info=True,
                extra={
                    "file_id": str(file_id),
                    "owner_id": str(owner_id),
                },
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error getting file: {str(e)}",
            )
    
    async def list_files(
        self,
        owner_id: Union[str, UUID],
        related_id: Optional[Union[str, UUID]] = None,
        related_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[FileWithPresignedUrl]:
        """List files for a user.
        
        Args:
            owner_id: ID of the user who owns the files
            related_id: ID of the related resource (optional)
            related_type: Type of the related resource (optional)
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List[FileWithPresignedUrl]: List of files with presigned URLs
        """
        try:
            # Get the files
            files = await file_repo.get_multi(
                self.db,
                owner_id=str(owner_id),
                related_id=str(related_id) if related_id else None,
                related_type=related_type,
                skip=skip,
                limit=limit,
            )
            
            # Generate presigned URLs for each file
            files_with_urls = []
            for file in files:
                presigned_url = self._generate_presigned_url(file.unique_filename)
                files_with_urls.append(
                    FileWithPresignedUrl(
                        **file.dict(),
                        presigned_url=presigned_url,
                    )
                )
            
            return files_with_urls
            
        except Exception as e:
            logger.error(
                f"Error listing files: {str(e)}",
                exc_info=True,
                extra={
                    "owner_id": str(owner_id),
                    "related_id": str(related_id) if related_id else None,
                    "related_type": related_type,
                },
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error listing files: {str(e)}",
            )
    
    async def delete_file(
        self,
        file_id: Union[str, UUID],
        owner_id: Union[str, UUID],
    ) -> bool:
        """Delete a file.
        
        Args:
            file_id: ID of the file to delete
            owner_id: ID of the user who owns the file
            
        Returns:
            bool: True if the file was deleted successfully, False otherwise
            
        Raises:
            HTTPException: If the file is not found or the user is not authorized
        """
        try:
            # Get the file record
            file = await file_repo.get(
                self.db,
                id=file_id,
                options=[
                    selectinload(File.owner),
                ],
            )
            
            if not file:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="File not found",
                )
            
            # Verify ownership
            if str(file.owner_id) != str(owner_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete this file",
                )
            
            # Delete from S3
            try:
                self.s3_client.delete_object(
                    Bucket=settings.AWS_S3_BUCKET,
                    Key=file.unique_filename,
                )
            except ClientError as e:
                logger.error(
                    f"Error deleting file from S3: {str(e)}",
                    exc_info=True,
                    extra={
                        "file_id": str(file_id),
                        "filename": file.unique_filename,
                    },
                )
                
                # Still delete the database record even if S3 deletion fails
                # (the file will be eventually cleaned up by S3 lifecycle rules)
            
            # Delete the database record
            await file_repo.delete(self.db, id=file_id)
            
            return True
            
        except Exception as e:
            logger.error(
                f"Error deleting file: {str(e)}",
                exc_info=True,
                extra={
                    "file_id": str(file_id),
                    "owner_id": str(owner_id),
                },
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error deleting file: {str(e)}",
            )
    
    def _generate_presigned_url(
        self,
        filename: str,
        expires_in: int = 3600,  # 1 hour
    ) -> str:
        """Generate a presigned URL for a file.
        
        Args:
            filename: The filename to generate a URL for
            expires_in: Number of seconds until the URL expires
            
        Returns:
            str: The presigned URL
        """
        try:
            return self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': settings.AWS_S3_BUCKET,
                    'Key': filename,
                },
                ExpiresIn=expires_in,
            )
            
        except ClientError as e:
            logger.error(
                f"Error generating presigned URL: {str(e)}",
                exc_info=True,
                extra={
                    "filename": filename,
                },
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error generating presigned URL: {str(e)}",
            )
