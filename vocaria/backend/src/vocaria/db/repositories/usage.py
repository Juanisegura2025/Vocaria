"""
Usage repository for tracking resource usage.

This module contains the UsageRepository class which provides methods for
interacting with the usage_records table in the database.
"""
from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple
from uuid import UUID

from sqlalchemy import and_, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from vocaria.db.models import Usage, User, Tour
from vocaria.schemas.usage import UsageCreate, UsagePeriod, UsageSummary

class UsageRepository:
    """Repository for tracking and managing resource usage."""
    
    async def create(
        self, 
        db: AsyncSession, 
        *, 
        obj_in: UsageCreate,
        commit: bool = True
    ) -> Usage:
        """Create a new usage record.
        
        Args:
            db: Database session
            obj_in: Usage data
            commit: Whether to commit the transaction
            
        Returns:
            Usage: The created usage record
        """
        db_obj = Usage(**obj_in.dict())
        db.add(db_obj)
        
        if commit:
            await db.commit()
            await db.refresh(db_obj)
            
        return db_obj
    
    async def get_usage_for_tour(
        self,
        db: AsyncSession,
        tour_id: Union[str, UUID],
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        group_by: str = "day"
    ) -> List[Dict[str, Any]]:
        """Get usage statistics for a specific tour.
        
        Args:
            db: Database session
            tour_id: ID of the tour
            start_date: Start date for the query
            end_date: End date for the query
            group_by: How to group the results (day, week, month)
            
        Returns:
            List[Dict[str, Any]]: List of usage statistics
        """
        # Set default date range if not provided
        if end_date is None:
            end_date = datetime.utcnow().date()
        if start_date is None:
            start_date = end_date - timedelta(days=30)
        
        # Determine the date truncation function based on group_by
        if group_by == "week":
            date_trunc = func.date_trunc('week', Usage.timestamp).label("period")
        elif group_by == "month":
            date_trunc = func.date_trunc('month', Usage.timestamp).label("period")
        else:  # default to day
            date_trunc = func.date_trunc('day', Usage.timestamp).label("period")
        
        # Build the query
        query = (
            select(
                date_trunc,
                func.sum(Usage.tts_seconds).label("total_tts_seconds"),
                func.sum(Usage.message_count).label("total_messages"),
                func.sum(Usage.api_call_count).label("total_api_calls"),
                func.sum(Usage.storage_bytes).label("total_storage_bytes"),
            )
            .where(
                and_(
                    Usage.tour_id == tour_id,
                    Usage.timestamp >= start_date,
                    Usage.timestamp <= end_date,
                )
            )
            .group_by("period")
            .order_by("period")
        )
        
        result = await db.execute(query)
        
        return [
            {
                "period": row.period,
                "total_tts_seconds": row.total_tts_seconds or 0,
                "total_messages": row.total_messages or 0,
                "total_api_calls": row.total_api_calls or 0,
                "total_storage_bytes": row.total_storage_bytes or 0,
            }
            for row in result.all()
        ]
    
    async def get_usage_summary(
        self,
        db: AsyncSession,
        owner_id: Union[str, UUID],
        period: UsagePeriod = UsagePeriod.MONTH,
    ) -> UsageSummary:
        """Get a summary of usage for all tours owned by a user.
        
        Args:
            db: Database session
            owner_id: ID of the owner
            period: Time period to get usage for
            
        Returns:
            UsageSummary: Summary of usage statistics
        """
        # Calculate date range based on period
        end_date = datetime.utcnow()
        
        if period == UsagePeriod.DAY:
            start_date = end_date - timedelta(days=1)
        elif period == UsagePeriod.WEEK:
            start_date = end_date - timedelta(weeks=1)
        elif period == UsagePeriod.MONTH:
            start_date = end_date - timedelta(days=30)
        elif period == UsagePeriod.YEAR:
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)  # Default to 30 days
        
        # Get usage for all tours owned by the user
        query = (
            select(
                Tour.id.label("tour_id"),
                Tour.name.label("tour_name"),
                func.sum(Usage.tts_seconds).label("total_tts_seconds"),
                func.sum(Usage.message_count).label("total_messages"),
                func.sum(Usage.api_call_count).label("total_api_calls"),
                func.sum(Usage.storage_bytes).label("total_storage_bytes"),
            )
            .join(Usage, Usage.tour_id == Tour.id, isouter=True)
            .where(
                and_(
                    Tour.owner_id == owner_id,
                    or_(
                        Usage.timestamp.between(start_date, end_date),
                        Usage.id.is_(None),  # Include tours with no usage
                    )
                )
            )
            .group_by(Tour.id)
        )
        
        result = await db.execute(query)
        
        # Calculate totals
        total_tts_seconds = 0
        total_messages = 0
        total_api_calls = 0
        total_storage_bytes = 0
        tour_usage = []
        
        for row in result.all():
            tts = row.total_tts_seconds or 0
            msgs = row.total_messages or 0
            calls = row.total_api_calls or 0
            storage = row.total_storage_bytes or 0
            
            total_tts_seconds += tts
            total_messages += msgs
            total_api_calls += calls
            total_storage_bytes += storage
            
            tour_usage.append({
                "tour_id": row.tour_id,
                "tour_name": row.tour_name,
                "tts_seconds": tts,
                "message_count": msgs,
                "api_call_count": calls,
                "storage_bytes": storage,
            })
        
        # Get previous period for comparison
        prev_start_date = start_date - (end_date - start_date) - timedelta(days=1)
        
        prev_query = (
            select(
                func.sum(Usage.tts_seconds).label("total_tts_seconds"),
                func.sum(Usage.message_count).label("total_messages"),
                func.sum(Usage.api_call_count).label("total_api_calls"),
            )
            .join(Tour, Tour.id == Usage.tour_id)
            .where(
                and_(
                    Tour.owner_id == owner_id,
                    Usage.timestamp.between(prev_start_date, start_date - timedelta(days=1))
                )
            )
        )
        
        prev_result = await db.execute(prev_query)
        prev_row = prev_result.one_or_none()
        
        prev_tts = (prev_row and prev_row.total_tts_seconds) or 0
        prev_msgs = (prev_row and prev_row.total_messages) or 0
        prev_calls = (prev_row and prev_row.total_api_calls) or 0
        
        # Calculate percentage changes
        def calculate_change(current: float, previous: float) -> float:
            if previous == 0:
                return 0.0 if current == 0 else 100.0
            return ((current - previous) / previous) * 100
        
        return UsageSummary(
            period_start=start_date,
            period_end=end_date,
            total_tts_seconds=total_tts_seconds,
            total_messages=total_messages,
            total_api_calls=total_api_calls,
            total_storage_bytes=total_storage_bytes,
            tts_seconds_change=calculate_change(total_tts_seconds, prev_tts),
            message_count_change=calculate_change(total_messages, prev_msgs),
            api_call_count_change=calculate_change(total_api_calls, prev_calls),
            tour_usage=tour_usage,
        )
    
    async def check_usage_limits(
        self,
        db: AsyncSession,
        owner_id: Union[str, UUID],
        plan_limits: Dict[str, int],
    ) -> Dict[str, Any]:
        """Check if the user has exceeded their usage limits.
        
        Args:
            db: Database session
            owner_id: ID of the owner
            plan_limits: Dictionary containing the plan limits
            
        Returns:
            Dict[str, Any]: Dictionary with usage and limit information
        """
        # Get current usage for the billing period
        # Assuming billing period is monthly for now
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        query = (
            select(
                func.sum(Usage.tts_seconds).label("tts_seconds"),
                func.sum(Usage.message_count).label("message_count"),
                func.sum(Usage.api_call_count).label("api_call_count"),
                func.sum(Usage.storage_bytes).label("storage_bytes"),
            )
            .join(Tour, Tour.id == Usage.tour_id)
            .where(
                and_(
                    Tour.owner_id == owner_id,
                    Usage.timestamp >= start_of_month
                )
            )
        )
        
        result = await db.execute(query)
        usage = result.one_or_none() or (0, 0, 0, 0)
        
        tts_seconds = usage.tts_seconds or 0
        message_count = usage.message_count or 0
        api_call_count = usage.api_call_count or 0
        storage_bytes = usage.storage_bytes or 0
        
        # Check against limits
        tts_limit = plan_limits.get("tts_seconds", float('inf'))
        messages_limit = plan_limits.get("message_count", float('inf'))
        api_calls_limit = plan_limits.get("api_call_count", float('inf'))
        storage_limit = plan_limits.get("storage_bytes", float('inf'))
        
        return {
            "tts_seconds": {
                "used": tts_seconds,
                "limit": tts_limit,
                "remaining": max(0, tts_limit - tts_seconds) if tts_limit != float('inf') else float('inf'),
                "percent_used": min(100, (tts_seconds / tts_limit) * 100) if tts_limit != float('inf') else 0,
                "over_limit": tts_seconds > tts_limit,
            },
            "message_count": {
                "used": message_count,
                "limit": messages_limit,
                "remaining": max(0, messages_limit - message_count) if messages_limit != float('inf') else float('inf'),
                "percent_used": min(100, (message_count / messages_limit) * 100) if messages_limit != float('inf') else 0,
                "over_limit": message_count > messages_limit,
            },
            "api_call_count": {
                "used": api_call_count,
                "limit": api_calls_limit,
                "remaining": max(0, api_calls_limit - api_call_count) if api_calls_limit != float('inf') else float('inf'),
                "percent_used": min(100, (api_call_count / api_calls_limit) * 100) if api_calls_limit != float('inf') else 0,
                "over_limit": api_call_count > api_calls_limit,
            },
            "storage_bytes": {
                "used": storage_bytes,
                "limit": storage_limit,
                "remaining": max(0, storage_limit - storage_bytes) if storage_limit != float('inf') else float('inf'),
                "percent_used": min(100, (storage_bytes / storage_limit) * 100) if storage_limit != float('inf') else 0,
                "over_limit": storage_bytes > storage_limit,
            },
            "any_over_limit": (
                tts_seconds > tts_limit or
                message_count > messages_limit or
                api_call_count > api_calls_limit or
                storage_bytes > storage_limit
            ),
        }

# Create a singleton instance for easy importing
usage_repo = UsageRepository()
