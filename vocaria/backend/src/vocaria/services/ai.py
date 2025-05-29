"""
AI service for handling AI-related operations.

This module contains the AIService class which provides business logic
for AI-related operations in the system.
"""
import json
import logging
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from vocaria.db.models import Conversation, Message, Lead, Tour, User
from vocaria.db.repositories.conversation import conversation_repo
from vocaria.db.repositories.lead import lead_repo
from vocaria.db.repositories.tour import tour_repo
from vocaria.services.auth import get_current_active_user

logger = logging.getLogger(__name__)

class AIService:
    """Service for AI-related operations."""
    
    def __init__(self, db: AsyncSession):
        """Initialize the AIService.
        
        Args:
            db: Database session
        """
        self.db = db
    
    async def generate_response(
        self,
        conversation_id: Union[str, UUID],
        lead_id: Union[str, UUID],
        tour_id: Union[str, UUID],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate an AI response for a conversation.
        
        Args:
            conversation_id: ID of the conversation
            lead_id: ID of the lead
            tour_id: ID of the tour
            metadata: Additional metadata for the AI response
            
        Returns:
            Dict[str, Any]: The AI response with content and metadata
            
        Raises:
            HTTPException: If there is an error generating the response
        """
        try:
            # Get the conversation with messages
            conversation = await conversation_repo.get(
                self.db,
                id=conversation_id,
                options=[
                    selectinload(Conversation.messages).selectinload(Message.attachments),
                    selectinload(Conversation.lead).selectinload(Lead.tour),
                ]
            )
            
            if not conversation or not conversation.lead or not conversation.lead.tour:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation, lead, or tour not found",
                )
            
            # Get the tour with its configuration
            tour = await tour_repo.get(
                self.db,
                id=tour_id,
                options=[
                    selectinload(Tour.ai_config),
                ]
            )
            
            if not tour or not tour.ai_config:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tour or AI configuration not found",
                )
            
            # Prepare the conversation history
            messages = []
            if conversation.messages:
                for msg in conversation.messages:
                    messages.append({
                        "role": msg.role,
                        "content": msg.content,
                        "timestamp": msg.created_at.isoformat(),
                    })
            
            # Prepare the context
            context = {
                "tour": {
                    "id": str(tour.id),
                    "title": tour.title,
                    "description": tour.description,
                },
                "lead": {
                    "id": str(conversation.lead.id),
                    "name": conversation.lead.name,
                    "email": conversation.lead.email,
                    "phone": conversation.lead.phone,
                },
                "ai_config": {
                    "model": tour.ai_config.model,
                    "temperature": float(tour.ai_config.temperature),
                    "max_tokens": tour.ai_config.max_tokens,
                    "system_prompt": tour.ai_config.system_prompt,
                },
            }
            
            # TODO: Integrate with the actual AI provider (e.g., OpenAI, Anthropic, etc.)
            # For now, we'll return a simple response
            response = {
                "content": "Thank you for your message. I'm an AI assistant for this property tour. How can I help you today?",
                "model": tour.ai_config.model,
                "tokens_used": 20,
                "context": context,
            }
            
            # Log the AI response
            logger.info(
                "Generated AI response",
                extra={
                    "conversation_id": str(conversation_id),
                    "lead_id": str(lead_id),
                    "tour_id": str(tour_id),
                    "response_length": len(response["content"]),
                    "tokens_used": response["tokens_used"],
                },
            )
            
            return response
            
        except Exception as e:
            logger.error(
                "Error generating AI response",
                exc_info=True,
                extra={
                    "conversation_id": str(conversation_id),
                    "lead_id": str(lead_id),
                    "tour_id": str(tour_id),
                    "error": str(e),
                },
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error generating AI response: {str(e)}",
            )
    
    async def analyze_sentiment(
        self,
        text: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Analyze the sentiment of a piece of text.
        
        Args:
            text: The text to analyze
            context: Additional context for the analysis
            
        Returns:
            Dict[str, Any]: The sentiment analysis results
        """
        try:
            # TODO: Integrate with an actual sentiment analysis service
            # For now, we'll return a simple analysis
            sentiment = "neutral"
            confidence = 0.8
            
            # Simple keyword-based sentiment analysis
            positive_words = ["good", "great", "excellent", "amazing", "love"]
            negative_words = ["bad", "terrible", "awful", "hate", "worst"]
            
            text_lower = text.lower()
            positive_count = sum(1 for word in positive_words if word in text_lower)
            negative_count = sum(1 for word in negative_words if word in text_lower)
            
            if positive_count > negative_count:
                sentiment = "positive"
                confidence = 0.7 + (positive_count * 0.1)
            elif negative_count > positive_count:
                sentiment = "negative"
                confidence = 0.7 + (negative_count * 0.1)
            
            return {
                "sentiment": sentiment,
                "confidence": min(confidence, 1.0),
                "positive_keywords": [word for word in positive_words if word in text_lower],
                "negative_keywords": [word for word in negative_words if word in text_lower],
                "context": context or {},
            }
            
        except Exception as e:
            logger.error(
                "Error analyzing sentiment",
                exc_info=True,
                extra={
                    "text_length": len(text),
                    "error": str(e),
                },
            )
            return {
                "sentiment": "neutral",
                "confidence": 0.5,
                "error": str(e),
            }
    
    async def extract_entities(
        self,
        text: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Extract entities from a piece of text.
        
        Args:
            text: The text to extract entities from
            context: Additional context for the extraction
            
        Returns:
            Dict[str, Any]: The extracted entities
        """
        try:
            # TODO: Integrate with an actual NER service
            # For now, we'll return a simple extraction
            entities = {
                "people": [],
                "organizations": [],
                "locations": [],
                "dates": [],
                "custom": [],
            }
            
            # Simple regex-based entity extraction
            import re
            
            # Extract email addresses
            email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
            emails = re.findall(email_pattern, text)
            if emails:
                entities["custom"].extend([{"type": "email", "value": email} for email in emails])
            
            # Extract phone numbers (US format for now)
            phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
            phones = re.findall(phone_pattern, text)
            if phones:
                entities["custom"].extend([{"type": "phone", "value": phone} for phone in phones])
            
            return {
                "entities": entities,
                "context": context or {},
            }
            
        except Exception as e:
            logger.error(
                "Error extracting entities",
                exc_info=True,
                extra={
                    "text_length": len(text),
                    "error": str(e),
                },
            )
            return {
                "entities": {},
                "error": str(e),
            }

# Dependency to get the AI service
def get_ai_service(
    db: AsyncSession = Depends(get_db),
) -> AIService:
    """Get an instance of the AI service.
    
    Args:
        db: Database session
        
    Returns:
        AIService: An instance of the AI service
    """
    return AIService(db)
