"""
Conversation repository for database operations.

This module contains the ConversationRepository class which provides methods for
interacting with the conversations and messages tables in the database.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple
from uuid import UUID

from sqlalchemy import and_, delete, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from vocaria.db.models import Conversation, Message, Lead, Tour
from vocaria.schemas.conversation import (
    ConversationCreate, 
    MessageCreate,
    MessageUpdate,
    ConversationWithMessages,
    MessageWithAttachments,
)
from .base import BaseRepository

class ConversationRepository(BaseRepository[Conversation, ConversationCreate, dict]):
    """Repository for Conversation model with custom methods."""
    
    def __init__(self):
        """Initialize the ConversationRepository with the Conversation model."""
        super().__init__(Conversation)
    
    async def get_with_messages(
        self, 
        db: AsyncSession, 
        conversation_id: Union[str, UUID],
        owner_id: Optional[Union[str, UUID]] = None
    ) -> Optional[ConversationWithMessages]:
        """Get a conversation with its messages and attachments.
        
        Args:
            db: Database session
            conversation_id: ID of the conversation to retrieve
            owner_id: Optional owner ID to verify tour ownership
            
        Returns:
            Optional[ConversationWithMessages]: The conversation with messages if found and authorized, None otherwise
        """
        query = (
            select(Conversation)
            .options(
                selectinload(Conversation.messages)
                .selectinload(Message.attachments),
                selectinload(Conversation.lead)
                .selectinload(Lead.tour)
            )
            .where(Conversation.id == conversation_id)
        )
        
        if owner_id is not None:
            query = query.join(Lead).join(Tour).where(Tour.owner_id == owner_id)
        
        result = await db.execute(query)
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            return None
            
        return ConversationWithMessages(
            **{c.name: getattr(conversation, c.name) for c in conversation.__table__.columns},
            lead=conversation.lead,
            messages=conversation.messages,
        )
    
    async def get_multi_by_lead(
        self,
        db: AsyncSession,
        lead_id: Union[str, UUID],
        *,
        skip: int = 0,
        limit: int = 100,
        owner_id: Optional[Union[str, UUID]] = None
    ) -> Tuple[List[Conversation], int]:
        """Get multiple conversations for a specific lead.
        
        Args:
            db: Database session
            lead_id: ID of the lead to get conversations for
            skip: Number of records to skip
            limit: Maximum number of records to return
            owner_id: Optional owner ID to verify tour ownership
            
        Returns:
            Tuple containing the list of conversations and total count
        """
        # Base query
        query = select(Conversation).where(Conversation.lead_id == lead_id)
        count_query = select(func.count()).select_from(Conversation).where(Conversation.lead_id == lead_id)
        
        if owner_id is not None:
            query = (
                query.join(Lead)
                .join(Tour)
                .where(Tour.owner_id == owner_id)
            )
            count_query = (
                count_query.join(Lead)
                .join(Tour)
                .where(Tour.owner_id == owner_id)
            )
        
        # Get total count
        total = (await db.execute(count_query)).scalar_one()
        
        # Apply pagination and ordering
        conversations = (
            await db.execute(
                query.order_by(Conversation.updated_at.desc())
                .offset(skip)
                .limit(limit)
                .options(
                    selectinload(Conversation.messages)
                    .selectinload(Message.attachments)
                )
            )
        ).scalars().all()
        
        return conversations, total
    
    async def add_message(
        self,
        db: AsyncSession,
        *,
        conversation_id: Union[str, UUID],
        message_in: MessageCreate,
        owner_id: Optional[Union[str, UUID]] = None
    ) -> Optional[MessageWithAttachments]:
        """Add a message to a conversation.
        
        Args:
            db: Database session
            conversation_id: ID of the conversation to add the message to
            message_in: Message data
            owner_id: Optional owner ID to verify tour ownership
            
        Returns:
            Optional[MessageWithAttachments]: The created message if successful, None otherwise
        """
        # Verify conversation exists and is accessible
        query = select(Conversation).where(Conversation.id == conversation_id)
        
        if owner_id is not None:
            query = query.join(Lead).join(Tour).where(Tour.owner_id == owner_id)
            
        result = await db.execute(query)
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            return None
            
        # Create the message
        message = Message(
            **message_in.dict(exclude={"attachments"}, exclude_unset=True),
            conversation_id=conversation_id,
        )
        
        # Add attachments if any
        if message_in.attachments:
            for attachment_in in message_in.attachments:
                attachment = Attachment(
                    **attachment_in.dict(),
                    message=message
                )
                db.add(attachment)
        
        db.add(message)
        
        # Update conversation's updated_at
        conversation.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(message)
        
        # Eager load attachments for the response
        await db.refresh(message, ["attachments"])
        
        return MessageWithAttachments(
            **{c.name: getattr(message, c.name) for c in message.__table__.columns},
            attachments=message.attachments or []
        )
    
    async def update_message(
        self,
        db: AsyncSession,
        *,
        message_id: Union[str, UUID],
        message_in: MessageUpdate,
        owner_id: Optional[Union[str, UUID]] = None
    ) -> Optional[MessageWithAttachments]:
        """Update a message in a conversation.
        
        Args:
            db: Database session
            message_id: ID of the message to update
            message_in: Updated message data
            owner_id: Optional owner ID to verify tour ownership
            
        Returns:
            Optional[MessageWithAttachments]: The updated message if successful, None otherwise
        """
        # Build the base query
        query = (
            update(Message)
            .where(Message.id == message_id)
            .values(
                **message_in.dict(exclude={"attachments"}, exclude_unset=True),
                updated_at=datetime.utcnow()
            )
            .returning(Message)
        )
        
        # Add owner verification if needed
        if owner_id is not None:
            query = query.where(
                Message.conversation_id.in_(
                    select(Conversation.id)
                    .join(Lead)
                    .join(Tour)
                    .where(and_(
                        Conversation.id == Message.conversation_id,
                        Tour.owner_id == owner_id
                    ))
                )
            )
        
        result = await db.execute(query)
        message = result.scalar_one_or_none()
        
        if not message:
            return None
            
        # Update conversation's updated_at
        await db.execute(
            update(Conversation)
            .where(Conversation.id == message.conversation_id)
            .values(updated_at=datetime.utcnow())
        )
        
        await db.commit()
        await db.refresh(message)
        
        # Eager load attachments for the response
        await db.refresh(message, ["attachments"])
        
        return MessageWithAttachments(
            **{c.name: getattr(message, c.name) for c in message.__table__.columns},
            attachments=message.attachments or []
        )
    
    async def get_conversation_stats(
        self,
        db: AsyncSession,
        owner_id: Union[str, UUID],
        days: int = 30
    ) -> Dict[str, Any]:
        """Get conversation statistics for a user.
        
        Args:
            db: Database session
            owner_id: ID of the owner
            days: Number of days to look back
            
        Returns:
            Dict[str, Any]: Conversation statistics
        """
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get total conversations
        total_query = (
            select(func.count(Conversation.id))
            .join(Lead)
            .join(Tour)
            .where(and_(
                Tour.owner_id == owner_id,
                Conversation.created_at.between(start_date, end_date)
            ))
        )
        
        # Get messages per conversation
        messages_query = (
            select(
                Conversation.id,
                func.count(Message.id).label('message_count')
            )
            .join(Lead)
            .join(Tour)
            .outerjoin(Message, Message.conversation_id == Conversation.id)
            .where(and_(
                Tour.owner_id == owner_id,
                Conversation.created_at.between(start_date, end_date)
            ))
            .group_by(Conversation.id)
        )
        
        # Get conversations by status
        status_query = (
            select(
                Conversation.status,
                func.count(Conversation.id).label('count')
            )
            .join(Lead)
            .join(Tour)
            .where(and_(
                Tour.owner_id == owner_id,
                Conversation.created_at.between(start_date, end_date)
            ))
            .group_by(Conversation.status)
        )
        
        # Execute queries
        total = (await db.execute(total_query)).scalar_one() or 0
        messages_result = (await db.execute(messages_query)).all()
        status_result = (await db.execute(status_query)).all()
        
        # Calculate average messages per conversation
        avg_messages = (
            sum(row.message_count for row in messages_result) / len(messages_result)
            if messages_result else 0
        )
        
        # Format status counts
        status_counts = {status: count for status, count in status_result}
        
        return {
            "total_conversations": total,
            "avg_messages_per_conversation": round(avg_messages, 2),
            "status_counts": status_counts,
            "time_period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            }
        }

# Create a singleton instance for easy importing
conversation_repo = ConversationRepository()
