"""
Conversation service for business logic related to conversations and messages.

This module contains the ConversationService class which provides business logic
for managing conversations and messages in the system.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple
from uuid import UUID

from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from vocaria.db.models import Conversation, Message, Lead, Tour, User, Attachment
from vocaria.db.repositories.conversation import conversation_repo
from vocaria.db.repositories.lead import lead_repo
from vocaria.db.repositories.tour import tour_repo
from vocaria.db.repositories.usage import usage_repo
from vocaria.schemas.conversation import (
    ConversationCreate,
    ConversationWithMessages,
    MessageCreate,
    MessageUpdate,
    MessageWithAttachments,
)
from vocaria.services.ai import AIService
from vocaria.services.auth import get_current_active_user
from vocaria.db.database import get_db
from .conversation_messages import ConversationMessageMixin

class ConversationService(ConversationMessageMixin):
    """Service for conversation and message operations."""
    
    def __init__(self, db: AsyncSession, current_user: Optional[User] = None):
        """Initialize the ConversationService.
        
        Args:
            db: Database session
            current_user: The currently authenticated user (optional for public endpoints)
        """
        self.db = db
        self.current_user = current_user
        self.ai_service = AIService(db)
    
    async def create(
        self, 
        lead_id: Union[str, UUID], 
        message_in: MessageCreate,
        is_ai_response: bool = False,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> MessageWithAttachments:
        """Create a new conversation with an initial message.
        
        Args:
            lead_id: ID of the lead to create the conversation for
            message_in: The initial message
            is_ai_response: Whether this is an AI-generated response
            metadata: Additional metadata for the message
            
        Returns:
            MessageWithAttachments: The created message with attachments
            
        Raises:
            HTTPException: If the lead is not found or the user is not authorized
        """
        # Get the lead with tour information
        lead = await lead_repo.get(
            self.db,
            id=lead_id,
            options=[selectinload(Lead.tour)]
        )
        
        if not lead or not lead.tour:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead or tour not found",
            )
        
        # For public access, only allow if the tour is active
        if not self.current_user and not lead.tour.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tour is not active",
            )
            
        # For authenticated users, verify ownership
        if self.current_user and not self.current_user.is_superuser and str(lead.tour.owner_id) != str(self.current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to create conversations for this lead",
            )
        
        # Create the conversation
        conversation = await conversation_repo.create(
            self.db,
            obj_in={"lead_id": lead_id},
        )
        
        # Add the initial message
        message = await self.add_message(
            conversation_id=conversation.id,
            message_in=message_in,
            is_ai_response=is_ai_response,
            metadata=metadata or {},
        )
        
        # Update the lead's last activity
        await lead_repo.update_last_activity(self.db, lead_id=lead_id)
        
        return message
    
    async def get(
        self, 
        conversation_id: Union[str, UUID],
        include_messages: bool = True,
    ) -> Optional[ConversationWithMessages]:
        """Get a conversation by ID.
        
        Args:
            conversation_id: ID of the conversation to retrieve
            include_messages: Whether to include messages in the response
            
        Returns:
            Optional[ConversationWithMessages]: The conversation if found and authorized, None otherwise
        """
        # Get the conversation with lead and tour information
        conversation = await conversation_repo.get(
            self.db,
            id=conversation_id,
            options=[
                selectinload(Conversation.lead).selectinload(Lead.tour),
                selectinload(Conversation.messages).selectinload(Message.attachments),
            ] if include_messages else [
                selectinload(Conversation.lead).selectinload(Lead.tour),
            ]
        )
        
        if not conversation or not conversation.lead or not conversation.lead.tour:
            return None
            
        # For public access, only allow if the tour is active
        if not self.current_user and not conversation.lead.tour.is_active:
            return None
            
        # For authenticated users, verify ownership
        if self.current_user and not self.current_user.is_superuser and str(conversation.lead.tour.owner_id) != str(self.current_user.id):
            return None
        
        # Convert to ConversationWithMessages
        conversation_dict = {
            c.name: getattr(conversation, c.name) 
            for c in conversation.__table__.columns
        }
        
        if include_messages:
            conversation_dict["messages"] = [
                {
                    **{c.name: getattr(msg, c.name) for c in msg.__table__.columns},
                    "attachments": msg.attachments,
                }
                for msg in conversation.messages
            ]
        
        conversation_dict["lead"] = conversation.lead
        
        return ConversationWithMessages(**conversation_dict)
    
    async def list_by_lead(
        self,
        lead_id: Union[str, UUID],
        skip: int = 0,
        limit: int = 100,
        include_messages: bool = False,
    ) -> Dict[str, Any]:
        """List conversations for a lead.
        
        Args:
            lead_id: ID of the lead
            skip: Number of records to skip
            limit: Maximum number of records to return
            include_messages: Whether to include messages in the response
            
        Returns:
            Dict[str, Any]: Dictionary containing the list of conversations and total count
        """
        # Get the lead with tour information
        lead = await lead_repo.get(
            self.db,
            id=lead_id,
            options=[selectinload(Lead.tour)]
        )
        
        if not lead or not lead.tour:
            return {"items": [], "total": 0, "skip": skip, "limit": limit}
            
        # For public access, only allow if the tour is active
        if not self.current_user and not lead.tour.is_active:
            return {"items": [], "total": 0, "skip": skip, "limit": limit}
            
        # For authenticated users, verify ownership
        if self.current_user and not self.current_user.is_superuser and str(lead.tour.owner_id) != str(self.current_user.id):
            return {"items": [], "total": 0, "skip": skip, "limit": limit}
        
        # Get conversations for the lead
        conversations, total = await conversation_repo.get_multi_by_lead(
            self.db,
            lead_id=lead_id,
            skip=skip,
            limit=limit,
            include_messages=include_messages,
        )
        
        # Format the response
        formatted_conversations = []
        for conv in conversations:
            conv_dict = {
                c.name: getattr(conv, c.name) 
                for c in conv.__table__.columns
            }
            
            if include_messages and hasattr(conv, 'messages'):
                conv_dict["messages"] = [
                    {
                        **{c.name: getattr(msg, c.name) for c in msg.__table__.columns},
                        "attachments": getattr(msg, 'attachments', []),
                    }
                    for msg in conv.messages
                ]
                
            formatted_conversations.append(conv_dict)
        
        return {
            "items": formatted_conversations,
            "total": total,
            "skip": skip,
            "limit": limit,
        }

# Dependency to get the conversation service
def get_conversation_service(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ConversationService:
    """Get an instance of the conversation service.
    
    Args:
        db: Database session
        current_user: The currently authenticated user
        
    Returns:
        ConversationService: An instance of the conversation service
    """
    return ConversationService(db, current_user)
