"""
Search service for full-text search operations.

This module contains the SearchService class which provides business logic
for searching across different types of content in the application.
"""
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, or_, and_, text

from vocaria.db.models import (
    Tour,
    Lead,
    Conversation,
    Message,
    File,
    User,
)
from vocaria.db.repositories import (
    tour_repo,
    lead_repo,
    conversation_repo,
    message_repo,
    file_repo,
)
from vocaria.schemas.search import (
    SearchQuery,
    SearchResult,
    SearchResults,
    SearchType,
)

logger = logging.getLogger(__name__)

class SearchService:
    """Service for search operations."""
    
    def __init__(self, db: AsyncSession):
        """Initialize the SearchService.
        
        Args:
            db: Database session
        """
        self.db = db
    
    async def search(
        self,
        query: SearchQuery,
    ) -> SearchResults:
        """Perform a search across different types of content.
        
        Args:
            query: The search query parameters
            
        Returns:
            SearchResults: The search results
            
        Raises:
            HTTPException: If there's an error performing the search
        """
        try:
            # Set default search type if not provided
            if not query.types:
                query.types = ["tour", "lead", "conversation", "message", "file"]
            
            # Get the search results for each type
            results = []
            
            if "tour" in query.types:
                tour_results = await self._search_tours(query)
                results.extend(tour_results)
            
            if "lead" in query.types:
                lead_results = await self._search_leads(query)
                results.extend(lead_results)
            
            if "conversation" in query.types:
                conversation_results = await self._search_conversations(query)
                results.extend(conversation_results)
            
            if "message" in query.types:
                message_results = await self._search_messages(query)
                results.extend(message_results)
            
            if "file" in query.types:
                file_results = await self._search_files(query)
                results.extend(file_results)
            
            # Sort results by relevance score (if available)
            results.sort(
                key=lambda x: x.score if hasattr(x, "score") else 0,
                reverse=True,
            )
            
            return SearchResults(
                query=query.query,
                total=len(results),
                results=results,
            )
            
        except Exception as e:
            logger.error(
                f"Error performing search: {str(e)}",
                exc_info=True,
                extra={
                    "query": query.dict(),
                },
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error performing search: {str(e)}",
            )
    
    async def _search_tours(
        self,
        query: SearchQuery,
    ) -> List[SearchResult]:
        """Search tours.
        
        Args:
            query: The search query parameters
            
        Returns:
            List[SearchResult]: List of tour search results
        """
        try:
            # Build the search query
            search_query = tour_repo.get_base_query(self.db)
            
            # Add search conditions
            conditions = []
            
            # Search in title and description
            if query.query:
                conditions.append(
                    or_(
                        Tour.title.ilike(f"%{query.query}%"),
                        Tour.description.ilike(f"%{query.query}%"),
                    )
                )
            
            # Filter by owner if provided
            if query.owner_id:
                conditions.append(Tour.owner_id == query.owner_id)
            
            # Filter by status if provided
            if query.status:
                conditions.append(Tour.status == query.status)
            
            # Apply conditions
            if conditions:
                search_query = search_query.filter(and_(*conditions))
            
            # Add full-text search if available
            if query.query:
                search_query = search_query.add_columns(
                    func.ts_rank(
                        Tour.search_vector,
                        func.to_tsquery(query.query),
                    ).label("score"),
                )
            
            # Order by relevance score (if available)
            if query.query:
                search_query = search_query.order_by(text("score DESC"))
            else:
                search_query = search_query.order_by(Tour.created_at.desc())
            
            # Apply pagination
            search_query = search_query.offset(query.skip).limit(query.limit)
            
            # Execute the query
            results = await tour_repo.execute(self.db, search_query)
            
            # Convert results to SearchResult objects
            return [
                SearchResult(
                    type="tour",
                    id=str(tour.id),
                    title=tour.title,
                    description=tour.description,
                    created_at=tour.created_at,
                    score=getattr(result, "score", None),
                )
                for tour, result in results
            ]
            
        except Exception as e:
            logger.error(
                f"Error searching tours: {str(e)}",
                exc_info=True,
                extra={
                    "query": query.dict(),
                },
            )
            return []
    
    async def _search_leads(
        self,
        query: SearchQuery,
    ) -> List[SearchResult]:
        """Search leads.
        
        Args:
            query: The search query parameters
            
        Returns:
            List[SearchResult]: List of lead search results
        """
        try:
            # Build the search query
            search_query = lead_repo.get_base_query(self.db)
            
            # Add search conditions
            conditions = []
            
            # Search in name, email, and notes
            if query.query:
                conditions.append(
                    or_(
                        Lead.name.ilike(f"%{query.query}%"),
                        Lead.email.ilike(f"%{query.query}%"),
                        Lead.notes.ilike(f"%{query.query}%"),
                    )
                )
            
            # Filter by tour if provided
            if query.tour_id:
                conditions.append(Lead.tour_id == query.tour_id)
            
            # Filter by status if provided
            if query.status:
                conditions.append(Lead.status == query.status)
            
            # Apply conditions
            if conditions:
                search_query = search_query.filter(and_(*conditions))
            
            # Add full-text search if available
            if query.query:
                search_query = search_query.add_columns(
                    func.ts_rank(
                        Lead.search_vector,
                        func.to_tsquery(query.query),
                    ).label("score"),
                )
            
            # Order by relevance score (if available)
            if query.query:
                search_query = search_query.order_by(text("score DESC"))
            else:
                search_query = search_query.order_by(Lead.created_at.desc())
            
            # Apply pagination
            search_query = search_query.offset(query.skip).limit(query.limit)
            
            # Execute the query
            results = await lead_repo.execute(self.db, search_query)
            
            # Convert results to SearchResult objects
            return [
                SearchResult(
                    type="lead",
                    id=str(lead.id),
                    title=lead.name,
                    description=lead.email,
                    created_at=lead.created_at,
                    score=getattr(result, "score", None),
                )
                for lead, result in results
            ]
            
        except Exception as e:
            logger.error(
                f"Error searching leads: {str(e)}",
                exc_info=True,
                extra={
                    "query": query.dict(),
                },
            )
            return []
    
    async def _search_conversations(
        self,
        query: SearchQuery,
    ) -> List[SearchResult]:
        """Search conversations.
        
        Args:
            query: The search query parameters
            
        Returns:
            List[SearchResult]: List of conversation search results
        """
        try:
            # Build the search query
            search_query = conversation_repo.get_base_query(self.db)
            
            # Add search conditions
            conditions = []
            
            # Search in messages
            if query.query:
                conditions.append(
                    Message.content.ilike(f"%{query.query}%")
                )
            
            # Filter by lead if provided
            if query.lead_id:
                conditions.append(Conversation.lead_id == query.lead_id)
            
            # Filter by status if provided
            if query.status:
                conditions.append(Conversation.status == query.status)
            
            # Apply conditions
            if conditions:
                search_query = search_query.filter(and_(*conditions))
            
            # Add full-text search if available
            if query.query:
                search_query = search_query.add_columns(
                    func.ts_rank(
                        Conversation.search_vector,
                        func.to_tsquery(query.query),
                    ).label("score"),
                )
            
            # Order by relevance score (if available)
            if query.query:
                search_query = search_query.order_by(text("score DESC"))
            else:
                search_query = search_query.order_by(Conversation.created_at.desc())
            
            # Apply pagination
            search_query = search_query.offset(query.skip).limit(query.limit)
            
            # Execute the query
            results = await conversation_repo.execute(self.db, search_query)
            
            # Convert results to SearchResult objects
            return [
                SearchResult(
                    type="conversation",
                    id=str(conversation.id),
                    title=f"Conversation with {conversation.lead.name}",
                    description=conversation.messages[0].content if conversation.messages else "",
                    created_at=conversation.created_at,
                    score=getattr(result, "score", None),
                )
                for conversation, result in results
            ]
            
        except Exception as e:
            logger.error(
                f"Error searching conversations: {str(e)}",
                exc_info=True,
                extra={
                    "query": query.dict(),
                },
            )
            return []
    
    async def _search_messages(
        self,
        query: SearchQuery,
    ) -> List[SearchResult]:
        """Search messages.
        
        Args:
            query: The search query parameters
            
        Returns:
            List[SearchResult]: List of message search results
        """
        try:
            # Build the search query
            search_query = message_repo.get_base_query(self.db)
            
            # Add search conditions
            conditions = []
            
            # Search in content
            if query.query:
                conditions.append(
                    Message.content.ilike(f"%{query.query}%")
                )
            
            # Filter by conversation if provided
            if query.conversation_id:
                conditions.append(Message.conversation_id == query.conversation_id)
            
            # Filter by role if provided
            if query.role:
                conditions.append(Message.role == query.role)
            
            # Apply conditions
            if conditions:
                search_query = search_query.filter(and_(*conditions))
            
            # Add full-text search if available
            if query.query:
                search_query = search_query.add_columns(
                    func.ts_rank(
                        Message.search_vector,
                        func.to_tsquery(query.query),
                    ).label("score"),
                )
            
            # Order by relevance score (if available)
            if query.query:
                search_query = search_query.order_by(text("score DESC"))
            else:
                search_query = search_query.order_by(Message.created_at.desc())
            
            # Apply pagination
            search_query = search_query.offset(query.skip).limit(query.limit)
            
            # Execute the query
            results = await message_repo.execute(self.db, search_query)
            
            # Convert results to SearchResult objects
            return [
                SearchResult(
                    type="message",
                    id=str(message.id),
                    title=message.role,
                    description=message.content,
                    created_at=message.created_at,
                    score=getattr(result, "score", None),
                )
                for message, result in results
            ]
            
        except Exception as e:
            logger.error(
                f"Error searching messages: {str(e)}",
                exc_info=True,
                extra={
                    "query": query.dict(),
                },
            )
            return []
    
    async def _search_files(
        self,
        query: SearchQuery,
    ) -> List[SearchResult]:
        """Search files.
        
        Args:
            query: The search query parameters
            
        Returns:
            List[SearchResult]: List of file search results
        """
        try:
            # Build the search query
            search_query = file_repo.get_base_query(self.db)
            
            # Add search conditions
            conditions = []
            
            # Search in filename and metadata
            if query.query:
                conditions.append(
                    or_(
                        File.filename.ilike(f"%{query.query}%"),
                        File.metadata.ilike(f"%{query.query}%"),
                    )
                )
            
            # Filter by owner if provided
            if query.owner_id:
                conditions.append(File.owner_id == query.owner_id)
            
            # Filter by content type if provided
            if query.content_type:
                conditions.append(File.content_type == query.content_type)
            
            # Apply conditions
            if conditions:
                search_query = search_query.filter(and_(*conditions))
            
            # Add full-text search if available
            if query.query:
                search_query = search_query.add_columns(
                    func.ts_rank(
                        File.search_vector,
                        func.to_tsquery(query.query),
                    ).label("score"),
                )
            
            # Order by relevance score (if available)
            if query.query:
                search_query = search_query.order_by(text("score DESC"))
            else:
                search_query = search_query.order_by(File.created_at.desc())
            
            # Apply pagination
            search_query = search_query.offset(query.skip).limit(query.limit)
            
            # Execute the query
            results = await file_repo.execute(self.db, search_query)
            
            # Convert results to SearchResult objects
            return [
                SearchResult(
                    type="file",
                    id=str(file.id),
                    title=file.filename,
                    description=file.content_type,
                    created_at=file.created_at,
                    score=getattr(result, "score", None),
                )
                for file, result in results
            ]
            
        except Exception as e:
            logger.error(
                f"Error searching files: {str(e)}",
                exc_info=True,
                extra={
                    "query": query.dict(),
                },
            )
            return []
