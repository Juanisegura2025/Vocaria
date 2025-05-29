"""
Conversation message service for business logic related to messages.

This module contains the message-related methods for the ConversationService class.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from vocaria.db.models import Conversation, Message, Lead, Tour, User, Attachment
from vocaria.db.repositories.conversation import conversation_repo
from vocaria.db.repositories.lead import lead_repo
from vocaria.db.repositories.usage import usage_repo
from vocaria.schemas.conversation import (
    ConversationWithMessages,
    MessageCreate,
    MessageUpdate,
    MessageWithAttachments,
)

class ConversationMessageMixin:
    """Mixin class for conversation message operations."""
    
    async def add_message(
        self,
        conversation_id: Union[str, UUID],
        message_in: MessageCreate,
        is_ai_response: bool = False,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> MessageWithAttachments:
        """Add a message to a conversation.
        
        Args:
            conversation_id: ID of the conversation
            message_in: The message data
            is_ai_response: Whether this is an AI-generated response
            metadata: Additional metadata for the message
            
        Returns:
            MessageWithAttachments: The created message with attachments
            
        Raises:
            HTTPException: If the conversation is not found or the user is not authorized
        """
        # Get the conversation with lead and tour information
        conversation = await conversation_repo.get(
            self.db,
            id=conversation_id,
            options=[
                selectinload(Conversation.lead).selectinload(Lead.tour),
            ]
        )
        
        if not conversation or not conversation.lead or not conversation.lead.tour:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
            
        # For public access, only allow if the tour is active
        if not self.current_user and not conversation.lead.tour.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tour is not active",
            )
            
        # For authenticated users, verify ownership
        if self.current_user and not self.current_user.is_superuser and str(conversation.lead.tour.owner_id) != str(self.current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to add messages to this conversation",
            )
        
        # Add the message
        message = await conversation_repo.add_message(
            self.db,
            conversation_id=conversation_id,
            message_in=message_in,
            is_ai_response=is_ai_response,
            metadata=metadata or {},
        )
        
        # Update the conversation's updated_at
        await conversation_repo.touch(self.db, id=conversation_id)
        
        # Update the lead's last activity
        await lead_repo.update_last_activity(self.db, lead_id=conversation.lead_id)
        
        # Record the message in usage
        await usage_repo.record_message_sent(
            self.db,
            tour_id=conversation.lead.tour_id,
            lead_id=conversation.lead_id,
            conversation_id=conversation_id,
            message_id=message.id,
            is_ai_response=is_ai_response,
        )
        
        return message
    
    async def get_message(
        self,
        message_id: Union[str, UUID],
    ) -> Optional[MessageWithAttachments]:
        """Get a message by ID.
        
        Args:
            message_id: ID of the message to retrieve
            
        Returns:
            Optional[MessageWithAttachments]: The message if found and authorized, None otherwise
        """
        # Get the message with conversation, lead, and tour information
        message = await conversation_repo.get_message(
            self.db,
            message_id=message_id,
            options=[
                selectinload(Message.conversation)
                .selectinload(Conversation.lead)
                .selectinload(Lead.tour),
                selectinload(Message.attachments),
            ]
        )
        
        if not message or not message.conversation or not message.conversation.lead or not message.conversation.lead.tour:
            return None
            
        # For public access, only allow if the tour is active
        if not self.current_user and not message.conversation.lead.tour.is_active:
            return None
            
        # For authenticated users, verify ownership
        if self.current_user and not self.current_user.is_superuser and str(message.conversation.lead.tour.owner_id) != str(self.current_user.id):
            return None
        
        # Convert to MessageWithAttachments
        message_dict = {
            c.name: getattr(message, c.name) 
            for c in message.__table__.columns
        }
        message_dict["attachments"] = message.attachments
        
        return MessageWithAttachments(**message_dict)
    
    async def update_message(
        self,
        message_id: Union[str, UUID],
        message_in: MessageUpdate,
    ) -> Optional[MessageWithAttachments]:
        """Update a message in a conversation.
        
        Args:
            message_id: ID of the message to update
            message_in: The updated message data
            
        Returns:
            Optional[MessageWithAttachments]: The updated message if found and authorized, None otherwise
        """
        # Get the message with conversation, lead, and tour information
        message = await conversation_repo.get_message(
            self.db,
            message_id=message_id,
            options=[
                selectinload(Message.conversation)
                .selectinload(Conversation.lead)
                .selectinload(Lead.tour),
                selectinload(Message.attachments),
            ]
        )
        
        if not message or not message.conversation or not message.conversation.lead or not message.conversation.lead.tour:
            return None
            
        # Only the owner or superuser can update messages
        if not self.current_user or (not self.current_user.is_superuser and str(message.conversation.lead.tour.owner_id) != str(self.current_user.id)):
            return None
        
        # Update the message
        updated_message = await conversation_repo.update_message(
            self.db,
            message_id=message_id,
            message_in=message_in,
        )
        
        # Update the conversation's updated_at
        await conversation_repo.touch(self.db, id=message.conversation_id)
        
        return updated_message
    
    async def delete_message(
        self,
        message_id: Union[str, UUID],
    ) -> bool:
        """Delete a message from a conversation.
        
        Args:
            message_id: ID of the message to delete
            
        Returns:
            bool: True if the message was deleted, False otherwise
        """
        # Get the message with conversation, lead, and tour information
        message = await conversation_repo.get_message(
            self.db,
            message_id=message_id,
            options=[
                selectinload(Message.conversation)
                .selectinload(Conversation.lead)
                .selectinload(Lead.tour),
            ]
        )
        
        if not message or not message.conversation or not message.conversation.lead or not message.conversation.lead.tour:
            return False
            
        # Only the owner or superuser can delete messages
        if not self.current_user or (not self.current_user.is_superuser and str(message.conversation.lead.tour.owner_id) != str(self.current_user.id)):
            return False
        
        # Delete the message
        deleted = await conversation_repo.delete_message(
            self.db,
            message_id=message_id,
        )
        
        if deleted:
            # Update the conversation's updated_at
            await conversation_repo.touch(self.db, id=message.conversation_id)
            
        return deleted
    
    async def generate_ai_response(
        self,
        conversation_id: Union[str, UUID],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[MessageWithAttachments]:
        """Generate an AI response for a conversation.
        
        Args:
            conversation_id: ID of the conversation
            metadata: Additional metadata for the AI response
            
        Returns:
            Optional[MessageWithAttachments]: The AI-generated message if successful, None otherwise
        """
        # Get the conversation with lead and tour information
        conversation = await conversation_repo.get(
            self.db,
            id=conversation_id,
            options=[
                selectinload(Conversation.lead).selectinload(Lead.tour),
                selectinload(Conversation.messages).selectinload(Message.attachments),
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
        
        # Generate the AI response
        ai_response = await self.ai_service.generate_response(
            conversation_id=conversation_id,
            lead_id=conversation.lead_id,
            tour_id=conversation.lead.tour_id,
            metadata=metadata or {},
        )
        
        # Add the AI response as a message
        if ai_response:
            message = await self.add_message(
                conversation_id=conversation_id,
                message_in=MessageCreate(
                    content=ai_response["content"],
                    role="assistant",
                ),
                is_ai_response=True,
                metadata={
                    "model": ai_response.get("model"),
                    "tokens_used": ai_response.get("tokens_used"),
                    **(metadata or {}),
                },
            )
            
            return message
        
        return None
