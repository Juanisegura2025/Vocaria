"""
Conversations API endpoints.

This module contains the FastAPI endpoints for managing conversations.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from vocaria.core.config import settings
from vocaria.db.models import Conversation, User, Lead
from vocaria.db.repositories.conversation import conversation_repo
from vocaria.services.conversation import ConversationService
from vocaria.schemas.conversation import (
    ConversationCreate,
    ConversationUpdate,
    ConversationInDB,
    MessageCreate,
    MessageUpdate,
    MessageInDB,
)

router = APIRouter()

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(conversation_repo.get_db),
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

@router.post("/", response_model=ConversationInDB)
async def create_conversation(
    conversation: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(conversation_repo.get_db),
) -> Conversation:
    """Create a new conversation.
    
    Args:
        conversation: Conversation creation data
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Conversation: The created conversation
        
    Raises:
        HTTPException: If the conversation cannot be created or the lead is not found
    """
    conversation_service = ConversationService(db)
    return await conversation_service.create_conversation(
        conversation=conversation,
        owner_id=current_user.id,
    )

@router.get("/", response_model=List[ConversationInDB])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(conversation_repo.get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    lead_id: Optional[str] = None,
) -> List[Conversation]:
    """List conversations.
    
    Args:
        current_user: The authenticated user
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Optional conversation status filter
        lead_id: Optional lead ID filter
        
    Returns:
        List[Conversation]: List of conversations
    """
    conversation_service = ConversationService(db)
    return await conversation_service.list_conversations(
        owner_id=current_user.id,
        status=status,
        lead_id=lead_id,
        skip=skip,
        limit=limit,
    )

@router.get("/{conversation_id}", response_model=ConversationInDB)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(conversation_repo.get_db),
) -> Conversation:
    """Get a conversation by ID.
    
    Args:
        conversation_id: The conversation ID
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Conversation: The conversation
        
    Raises:
        HTTPException: If the conversation is not found or the user is not authorized
    """
    conversation_service = ConversationService(db)
    return await conversation_service.get_conversation(
        conversation_id=conversation_id,
        owner_id=current_user.id,
    )

@router.put("/{conversation_id}", response_model=ConversationInDB)
async def update_conversation(
    conversation_id: str,
    conversation_update: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(conversation_repo.get_db),
) -> Conversation:
    """Update a conversation.
    
    Args:
        conversation_id: The conversation ID
        conversation_update: Conversation update data
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Conversation: The updated conversation
        
    Raises:
        HTTPException: If the conversation is not found or the user is not authorized
    """
    conversation_service = ConversationService(db)
    return await conversation_service.update_conversation(
        conversation_id=conversation_id,
        conversation_update=conversation_update,
        owner_id=current_user.id,
    )

@router.delete("/{conversation_id}", response_model=ConversationInDB)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(conversation_repo.get_db),
) -> Conversation:
    """Delete a conversation.
    
    Args:
        conversation_id: The conversation ID
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Conversation: The deleted conversation
        
    Raises:
        HTTPException: If the conversation is not found or the user is not authorized
    """
    conversation_service = ConversationService(db)
    return await conversation_service.delete_conversation(
        conversation_id=conversation_id,
        owner_id=current_user.id,
    )

@router.post("/{conversation_id}/messages", response_model=MessageInDB)
async def create_message(
    conversation_id: str,
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(conversation_repo.get_db),
) -> Message:
    """Create a new message in a conversation.
    
    Args:
        conversation_id: The conversation ID
        message: Message creation data
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Message: The created message
        
    Raises:
        HTTPException: If the message cannot be created or the conversation is not found
    """
    conversation_service = ConversationService(db)
    return await conversation_service.create_message(
        conversation_id=conversation_id,
        message=message,
        owner_id=current_user.id,
    )

@router.get("/{conversation_id}/messages", response_model=List[MessageInDB])
async def list_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(conversation_repo.get_db),
    skip: int = 0,
    limit: int = 100,
) -> List[Message]:
    """List messages in a conversation.
    
    Args:
        conversation_id: The conversation ID
        current_user: The authenticated user
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List[Message]: List of messages
        
    Raises:
        HTTPException: If the conversation is not found or the user is not authorized
    """
    conversation_service = ConversationService(db)
    return await conversation_service.list_messages(
        conversation_id=conversation_id,
        owner_id=current_user.id,
        skip=skip,
        limit=limit,
    )

@router.websocket("/{conversation_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(conversation_repo.get_db),
):
    """WebSocket endpoint for real-time conversation updates.
    
    Args:
        websocket: WebSocket connection
        conversation_id: The conversation ID
        current_user: The authenticated user
        db: Database session
    """
    await websocket.accept()
    conversation_service = ConversationService(db)
    
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming message
            message = await conversation_service.handle_websocket_message(
                conversation_id=conversation_id,
                owner_id=current_user.id,
                message_data=data,
            )
            
            # Send response
            await websocket.send_json(message)
    except WebSocketDisconnect:
        conversation_service.disconnect(
            conversation_id=conversation_id,
            owner_id=current_user.id,
        )
