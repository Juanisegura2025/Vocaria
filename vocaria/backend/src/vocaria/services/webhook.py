"""
Webhook service for handling incoming webhook requests.

This module contains the WebhookService class which provides business logic
for processing webhooks from external services like Matterport and Twilio.
"""
import logging
from datetime import datetime
from typing import Any, Dict, Optional, Union
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from vocaria.core.config import settings
from vocaria.db.models import (
    WebhookEvent,
    WebhookSubscription,
    User,
    Tour,
    Lead,
    Conversation,
    Message,
)
from vocaria.db.repositories.webhook import webhook_event_repo, webhook_subscription_repo
from vocaria.db.repositories.tour import tour_repo
from vocaria.db.repositories.lead import lead_repo
from vocaria.db.repositories.conversation import conversation_repo
from vocaria.db.repositories.message import message_repo
from vocaria.services.notification import NotificationService
from vocaria.schemas.webhook import (
    WebhookEventCreate,
    WebhookSubscriptionCreate,
    WebhookSubscriptionUpdate,
    WebhookEventType,
    WebhookEventStatus,
)

logger = logging.getLogger(__name__)

class WebhookService:
    """Service for webhook operations."""
    
    def __init__(
        self, 
        db: AsyncSession,
        notification_service: Optional[NotificationService] = None,
    ):
        """Initialize the WebhookService.
        
        Args:
            db: Database session
            notification_service: Notification service instance (optional)
        """
        self.db = db
        self.notification_service = notification_service or NotificationService(db)
    
    async def process_webhook(
        self,
        event_type: str,
        payload: Dict[str, Any],
        source: str,
        signature: Optional[str] = None,
    ) -> WebhookEvent:
        """Process an incoming webhook event.
        
        Args:
            event_type: Type of the webhook event
            payload: Payload from the webhook
            source: Source of the webhook (e.g., 'matterport', 'twilio')
            signature: Signature for webhook verification (optional)
            
        Returns:
            WebhookEvent: The processed webhook event
            
        Raises:
            HTTPException: If there's an error processing the webhook
        """
        try:
            # Verify the webhook signature if provided
            if signature and not await self._verify_signature(
                payload=payload,
                signature=signature,
                source=source,
            ):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid webhook signature",
                )
            
            # Create the webhook event
            event = await webhook_event_repo.create(
                self.db,
                obj_in=WebhookEventCreate(
                    event_type=event_type,
                    source=source,
                    payload=payload,
                    status=WebhookEventStatus.PENDING,
                ),
            )
            
            # Process the event based on its type and source
            await self._process_event(event)
            
            return event
            
        except Exception as e:
            logger.error(
                f"Error processing webhook: {str(e)}",
                exc_info=True,
                extra={
                    "event_type": event_type,
                    "source": source,
                },
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing webhook: {str(e)}",
            )
    
    async def _verify_signature(
        self,
        payload: Dict[str, Any],
        signature: str,
        source: str,
    ) -> bool:
        """Verify a webhook signature.
        
        Args:
            payload: The webhook payload
            signature: The signature to verify
            source: The source of the webhook
            
        Returns:
            bool: True if the signature is valid, False otherwise
        """
        # Get the secret key for the source
        secret_key = {
            "matterport": settings.MATTERPORT_WEBHOOK_SECRET,
            "twilio": settings.TWILIO_WEBHOOK_SECRET,
        }.get(source)
        
        if not secret_key:
            logger.warning(
                "No secret key configured for webhook source",
                extra={
                    "source": source,
                },
            )
            return False
            
        # TODO: Implement signature verification logic
        # This would typically involve:
        # 1. Hashing the payload with the secret key
        # 2. Comparing the result with the provided signature
        # 3. Returning True if they match, False otherwise
        
        return True
    
    async def _process_event(self, event: WebhookEvent) -> None:
        """Process a webhook event based on its type and source.
        
        Args:
            event: The webhook event to process
        """
        try:
            # Get the subscription for this event type
            subscription = await webhook_subscription_repo.get_by_event_type(
                self.db,
                event_type=event.event_type,
            )
            
            if not subscription:
                logger.warning(
                    "No subscription found for webhook event type",
                    extra={
                        "event_type": event.event_type,
                    },
                )
                return
            
            # Process the event based on its type and source
            if event.source == "matterport":
                await self._process_matterport_event(event, subscription)
            elif event.source == "twilio":
                await self._process_twilio_event(event, subscription)
            else:
                logger.warning(
                    "Unknown webhook source",
                    extra={
                        "source": event.source,
                    },
                )
            
            # Update the event status
            await webhook_event_repo.update(
                self.db,
                db_obj=event,
                obj_in={"status": WebhookEventStatus.PROCESSED},
            )
            
        except Exception as e:
            logger.error(
                f"Error processing webhook event: {str(e)}",
                exc_info=True,
                extra={
                    "event_id": str(event.id),
                    "event_type": event.event_type,
                    "source": event.source,
                },
            )
            
            # Update the event status to failed
            await webhook_event_repo.update(
                self.db,
                db_obj=event,
                obj_in={
                    "status": WebhookEventStatus.FAILED,
                    "error_message": str(e),
                },
            )
    
    async def _process_matterport_event(
        self,
        event: WebhookEvent,
        subscription: WebhookSubscription,
    ) -> None:
        """Process a Matterport webhook event.
        
        Args:
            event: The webhook event
            subscription: The webhook subscription
        """
        try:
            # Get the tour associated with this event
            tour = await tour_repo.get_by_matterport_id(
                self.db,
                matterport_id=event.payload.get("model_id"),
            )
            
            if not tour:
                logger.warning(
                    "No tour found for Matterport model ID",
                    extra={
                        "model_id": event.payload.get("model_id"),
                    },
                )
                return
            
            # Handle different Matterport event types
            if event.event_type == WebhookEventType.MATTERPORT_VIEW:
                await self._handle_matterport_view(event, tour)
            elif event.event_type == WebhookEventType.MATTERPORT_COMMENT:
                await self._handle_matterport_comment(event, tour)
            else:
                logger.warning(
                    "Unknown Matterport event type",
                    extra={
                        "event_type": event.event_type,
                    },
                )
            
        except Exception as e:
            logger.error(
                f"Error processing Matterport event: {str(e)}",
                exc_info=True,
                extra={
                    "event_id": str(event.id),
                    "event_type": event.event_type,
                    "tour_id": str(tour.id) if tour else None,
                },
            )
            raise
    
    async def _process_twilio_event(
        self,
        event: WebhookEvent,
        subscription: WebhookSubscription,
    ) -> None:
        """Process a Twilio webhook event.
        
        Args:
            event: The webhook event
            subscription: The webhook subscription
        """
        try:
            # Get the lead associated with this phone number
            lead = await lead_repo.get_by_phone(
                self.db,
                phone=event.payload.get("From"),
            )
            
            if not lead:
                # Create a new lead if this is a new contact
                lead = await lead_repo.create(
                    self.db,
                    obj_in={
                        "phone": event.payload.get("From"),
                        "name": event.payload.get("FromCity", "Unknown"),
                        "status": "new",
                    },
                )
            
            # Create a new conversation if needed
            conversation = await conversation_repo.get_by_lead(
                self.db,
                lead_id=lead.id,
                channel="sms",
            )
            
            if not conversation:
                conversation = await conversation_repo.create(
                    self.db,
                    obj_in={
                        "lead_id": lead.id,
                        "channel": "sms",
                        "status": "active",
                    },
                )
            
            # Create a new message
            await message_repo.create(
                self.db,
                obj_in={
                    "conversation_id": conversation.id,
                    "content": event.payload.get("Body", ""),
                    "role": "user",
                    "channel": "sms",
                    "metadata": {
                        "twilio": {
                            "sid": event.payload.get("MessageSid"),
                            "from": event.payload.get("From"),
                            "to": event.payload.get("To"),
                        },
                    },
                },
            )
            
            # Send a notification about the new SMS
            await self.notification_service.send_notification(
                notification_in={
                    "type": WebhookEventType.TWILIO_MESSAGE,
                    "title": "New SMS Message Received",
                    "message": f"New SMS message received from {event.payload.get('From')}",
                    "recipient_id": lead.owner_id,
                    "metadata": {
                        "lead_id": str(lead.id),
                        "conversation_id": str(conversation.id),
                        "message": event.payload.get("Body", ""),
                    },
                },
            )
            
        except Exception as e:
            logger.error(
                f"Error processing Twilio event: {str(e)}",
                exc_info=True,
                extra={
                    "event_id": str(event.id),
                    "event_type": event.event_type,
                    "phone": event.payload.get("From"),
                },
            )
            raise
    
    async def _handle_matterport_view(
        self,
        event: WebhookEvent,
        tour: Tour,
    ) -> None:
        """Handle a Matterport view event.
        
        Args:
            event: The webhook event
            tour: The associated tour
        """
        try:
            # Update the tour's view count
            await tour_repo.update(
                self.db,
                db_obj=tour,
                obj_in={
                    "view_count": tour.view_count + 1,
                    "last_viewed_at": datetime.now(timezone.utc),
                },
            )
            
            # Create a new lead if this is a new viewer
            viewer_email = event.payload.get("email")
            if viewer_email:
                lead = await lead_repo.get_by_email(
                    self.db,
                    email=viewer_email,
                )
                
                if not lead:
                    lead = await lead_repo.create(
                        self.db,
                        obj_in={
                            "email": viewer_email,
                            "name": event.payload.get("name", "Unknown"),
                            "status": "new",
                            "tour_id": tour.id,
                        },
                    )
                    
                    # Send a notification about the new lead
                    await self.notification_service.send_notification(
                        notification_in={
                            "type": WebhookEventType.NEW_LEAD,
                            "title": "New Lead from Matterport",
                            "message": f"New lead from Matterport: {viewer_email}",
                            "recipient_id": tour.owner_id,
                            "metadata": {
                                "lead_id": str(lead.id),
                                "tour_id": str(tour.id),
                                "source": "matterport",
                            },
                        },
                    )
            
        except Exception as e:
            logger.error(
                f"Error handling Matterport view event: {str(e)}",
                exc_info=True,
                extra={
                    "event_id": str(event.id),
                    "tour_id": str(tour.id),
                    "email": event.payload.get("email"),
                },
            )
            raise
    
    async def _handle_matterport_comment(
        self,
        event: WebhookEvent,
        tour: Tour,
    ) -> None:
        """Handle a Matterport comment event.
        
        Args:
            event: The webhook event
            tour: The associated tour
        """
        try:
            # Get or create a lead for the commenter
            commenter_email = event.payload.get("email")
            if not commenter_email:
                logger.warning(
                    "No email provided for Matterport comment",
                    extra={
                        "event_id": str(event.id),
                    },
                )
                return
            
            lead = await lead_repo.get_by_email(
                self.db,
                email=commenter_email,
            )
            
            if not lead:
                lead = await lead_repo.create(
                    self.db,
                    obj_in={
                        "email": commenter_email,
                        "name": event.payload.get("name", "Unknown"),
                        "status": "active",
                        "tour_id": tour.id,
                    },
                )
            
            # Create or update a conversation
            conversation = await conversation_repo.get_by_lead(
                self.db,
                lead_id=lead.id,
                channel="matterport",
            )
            
            if not conversation:
                conversation = await conversation_repo.create(
                    self.db,
                    obj_in={
                        "lead_id": lead.id,
                        "channel": "matterport",
                        "status": "active",
                    },
                )
            
            # Create a new message
            await message_repo.create(
                self.db,
                obj_in={
                    "conversation_id": conversation.id,
                    "content": event.payload.get("comment", ""),
                    "role": "user",
                    "channel": "matterport",
                    "metadata": {
                        "matterport": {
                            "comment_id": event.payload.get("id"),
                            "location": event.payload.get("location"),
                        },
                    },
                },
            )
            
            # Send a notification about the new comment
            await self.notification_service.send_notification(
                notification_in={
                    "type": WebhookEventType.MATTERPORT_COMMENT,
                    "title": "New Matterport Comment",
                    "message": f"New comment from {commenter_email} on tour {tour.title}",
                    "recipient_id": tour.owner_id,
                    "metadata": {
                        "lead_id": str(lead.id),
                        "tour_id": str(tour.id),
                        "comment": event.payload.get("comment", ""),
                    },
                },
            )
            
        except Exception as e:
            logger.error(
                f"Error handling Matterport comment event: {str(e)}",
                exc_info=True,
                extra={
                    "event_id": str(event.id),
                    "tour_id": str(tour.id),
                    "email": event.payload.get("email"),
                },
            )
            raise
