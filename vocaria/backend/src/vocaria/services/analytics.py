"""
Analytics service for tracking and analyzing usage patterns.

This module contains the AnalyticsService class which provides business logic
for tracking and analyzing various metrics and usage patterns in the application.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func

from vocaria.db.models import (
    User,
    Tour,
    Lead,
    Conversation,
    Message,
    UsageRecord,
    WebhookEvent,
)
from vocaria.db.repositories import (
    user_repo,
    tour_repo,
    lead_repo,
    conversation_repo,
    message_repo,
    usage_repo,
    webhook_event_repo,
)
from vocaria.schemas.analytics import (
    AnalyticsQuery,
    AnalyticsResult,
    UsageMetrics,
    UserActivity,
    TourMetrics,
    LeadMetrics,
    ConversationMetrics,
    MessageMetrics,
)

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service for analytics operations."""
    
    def __init__(self, db: AsyncSession):
        """Initialize the AnalyticsService.
        
        Args:
            db: Database session
        """
        self.db = db
    
    async def get_analytics(
        self,
        query: AnalyticsQuery,
    ) -> AnalyticsResult:
        """Get analytics data based on the query parameters.
        
        Args:
            query: The analytics query parameters
            
        Returns:
            AnalyticsResult: The analytics results
            
        Raises:
            HTTPException: If there's an error retrieving analytics data
        """
        try:
            # Set default date range if not provided
            if not query.start_date:
                query.start_date = datetime.utcnow() - timedelta(days=30)
            if not query.end_date:
                query.end_date = datetime.utcnow()
            
            # Get the appropriate metrics based on the query type
            if query.type == "usage":
                return await self.get_usage_metrics(query)
            elif query.type == "user_activity":
                return await self.get_user_activity(query)
            elif query.type == "tour_metrics":
                return await self.get_tour_metrics(query)
            elif query.type == "lead_metrics":
                return await self.get_lead_metrics(query)
            elif query.type == "conversation_metrics":
                return await self.get_conversation_metrics(query)
            elif query.type == "message_metrics":
                return await self.get_message_metrics(query)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unknown analytics type: {query.type}",
                )
            
        except Exception as e:
            logger.error(
                f"Error retrieving analytics data: {str(e)}",
                exc_info=True,
                extra={
                    "query_type": query.type,
                    "start_date": query.start_date.isoformat() if query.start_date else None,
                    "end_date": query.end_date.isoformat() if query.end_date else None,
                },
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error retrieving analytics data: {str(e)}",
            )
    
    async def get_usage_metrics(
        self,
        query: AnalyticsQuery,
    ) -> AnalyticsResult:
        """Get usage metrics for the specified time period.
        
        Args:
            query: The analytics query parameters
            
        Returns:
            AnalyticsResult: The usage metrics
        """
        # Get total usage records
        total_usage = await usage_repo.count(
            self.db,
            start_date=query.start_date,
            end_date=query.end_date,
        )
        
        # Get usage by resource type
        usage_by_type = await usage_repo.get_usage_by_type(
            self.db,
            start_date=query.start_date,
            end_date=query.end_date,
        )
        
        # Get usage by action
        usage_by_action = await usage_repo.get_usage_by_action(
            self.db,
            start_date=query.start_date,
            end_date=query.end_date,
        )
        
        # Get usage by user
        usage_by_user = await usage_repo.get_usage_by_user(
            self.db,
            start_date=query.start_date,
            end_date=query.end_date,
        )
        
        return AnalyticsResult(
            type="usage",
            metrics=UsageMetrics(
                total_usage=total_usage,
                usage_by_type=usage_by_type,
                usage_by_action=usage_by_action,
                usage_by_user=usage_by_user,
            ),
        )
    
    async def get_user_activity(
        self,
        query: AnalyticsQuery,
    ) -> AnalyticsResult:
        """Get user activity metrics for the specified time period.
        
        Args:
            query: The analytics query parameters
            
        Returns:
            AnalyticsResult: The user activity metrics
        """
        # Get total active users
        total_users = await user_repo.count(
            self.db,
            created_at__gte=query.start_date,
            created_at__lte=query.end_date,
        )
        
        # Get user activity by day
        user_activity_by_day = await user_repo.get_activity_by_day(
            self.db,
            start_date=query.start_date,
            end_date=query.end_date,
        )
        
        # Get user engagement metrics
        user_engagement = await user_repo.get_engagement_metrics(
            self.db,
            start_date=query.start_date,
            end_date=query.end_date,
        )
        
        return AnalyticsResult(
            type="user_activity",
            metrics=UserActivity(
                total_users=total_users,
                user_activity_by_day=user_activity_by_day,
                user_engagement=user_engagement,
            ),
        )
    
    async def get_tour_metrics(
        self,
        query: AnalyticsQuery,
    ) -> AnalyticsResult:
        """Get tour metrics for the specified time period.
        
        Args:
            query: The analytics query parameters
            
        Returns:
            AnalyticsResult: The tour metrics
        """
        # Get total tours
        total_tours = await tour_repo.count(
            self.db,
            created_at__gte=query.start_date,
            created_at__lte=query.end_date,
        )
        
        # Get tour views by day
        tour_views_by_day = await tour_repo.get_views_by_day(
            self.db,
            start_date=query.start_date,
            end_date=query.end_date,
        )
        
        # Get tour engagement metrics
        tour_engagement = await tour_repo.get_engagement_metrics(
            self.db,
            start_date=query.start_date,
            end_date=query.end_date,
        )
        
        return AnalyticsResult(
            type="tour_metrics",
            metrics=TourMetrics(
                total_tours=total_tours,
                tour_views_by_day=tour_views_by_day,
                tour_engagement=tour_engagement,
            ),
        )
    
    async def get_lead_metrics(
        self,
        query: AnalyticsQuery,
    ) -> AnalyticsResult:
        """Get lead metrics for the specified time period.
        
        Args:
            query: The analytics query parameters
            
        Returns:
            AnalyticsResult: The lead metrics
        """
        # Get total leads
        total_leads = await lead_repo.count(
            self.db,
            created_at__gte=query.start_date,
            created_at__lte=query.end_date,
        )
        
        # Get leads by status
        leads_by_status = await lead_repo.get_leads_by_status(
            self.db,
            start_date=query.start_date,
            end_date=query.end_date,
        )
        
        # Get lead conversion rates
        conversion_rates = await lead_repo.get_conversion_rates(
            self.db,
            start_date=query.start_date,
            end_date=query.end_date,
        )
        
        return AnalyticsResult(
            type="lead_metrics",
            metrics=LeadMetrics(
                total_leads=total_leads,
                leads_by_status=leads_by_status,
                conversion_rates=conversion_rates,
            ),
        )
    
    async def get_conversation_metrics(
        self,
        query: AnalyticsQuery,
    ) -> AnalyticsResult:
        """Get conversation metrics for the specified time period.
        
        Args:
            query: The analytics query parameters
            
        Returns:
            AnalyticsResult: The conversation metrics
        """
        # Get total conversations
        total_conversations = await conversation_repo.count(
            self.db,
            created_at__gte=query.start_date,
            created_at__lte=query.end_date,
        )
        
        # Get conversations by channel
        conversations_by_channel = await conversation_repo.get_conversations_by_channel(
            self.db,
            start_date=query.start_date,
            end_date=query.end_date,
        )
        
        # Get conversation duration metrics
        duration_metrics = await conversation_repo.get_duration_metrics(
            self.db,
            start_date=query.start_date,
            end_date=query.end_date,
        )
        
        return AnalyticsResult(
            type="conversation_metrics",
            metrics=ConversationMetrics(
                total_conversations=total_conversations,
                conversations_by_channel=conversations_by_channel,
                duration_metrics=duration_metrics,
            ),
        )
    
    async def get_message_metrics(
        self,
        query: AnalyticsQuery,
    ) -> AnalyticsResult:
        """Get message metrics for the specified time period.
        
        Args:
            query: The analytics query parameters
            
        Returns:
            AnalyticsResult: The message metrics
        """
        # Get total messages
        total_messages = await message_repo.count(
            self.db,
            created_at__gte=query.start_date,
            created_at__lte=query.end_date,
        )
        
        # Get messages by role
        messages_by_role = await message_repo.get_messages_by_role(
            self.db,
            start_date=query.start_date,
            end_date=query.end_date,
        )
        
        # Get message response times
        response_times = await message_repo.get_response_times(
            self.db,
            start_date=query.start_date,
            end_date=query.end_date,
        )
        
        return AnalyticsResult(
            type="message_metrics",
            metrics=MessageMetrics(
                total_messages=total_messages,
                messages_by_role=messages_by_role,
                response_times=response_times,
            ),
        )
