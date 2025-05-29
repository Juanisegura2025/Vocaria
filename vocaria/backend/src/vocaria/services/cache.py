"""
Cache service for managing cached data.

This module contains the CacheService class which provides business logic
for managing cached data using Redis.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

import aioredis
from fastapi import HTTPException, status

from vocaria.core.config import settings
from vocaria.db.models import CacheItem
from vocaria.db.repositories.cache import cache_repo
from vocaria.schemas.cache import CacheKey, CacheValue, CacheItemCreate

logger = logging.getLogger(__name__)

class CacheService:
    """Service for cache operations."""
    
    def __init__(self, db: AsyncSession):
        """Initialize the CacheService.
        
        Args:
            db: Database session
        """
        self.db = db
        self.redis = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
        )
    
    async def get(
        self,
        key: Union[str, CacheKey],
        default: Optional[Any] = None,
    ) -> Optional[CacheValue]:
        """Get a cached value.
        
        Args:
            key: The cache key to retrieve
            default: Default value to return if key is not found
            
        Returns:
            Optional[CacheValue]: The cached value if found, default otherwise
        """
        try:
            # Try to get from Redis first
            value = await self.redis.get(str(key))
            if value is not None:
                return value
            
            # If not in Redis, try to get from database
            cache_item = await cache_repo.get(
                self.db,
                key=str(key),
            )
            
            if cache_item:
                # Update Redis cache
                await self.redis.setex(
                    str(key),
                    cache_item.expires_at - datetime.utcnow(),
                    cache_item.value,
                )
                
                return cache_item.value
            
            return default
            
        except Exception as e:
            logger.error(
                f"Error getting cache value: {str(e)}",
                exc_info=True,
                extra={
                    "key": str(key),
                },
            )
            return default
    
    async def set(
        self,
        key: Union[str, CacheKey],
        value: CacheValue,
        expire: Optional[timedelta] = None,
    ) -> bool:
        """Set a cached value.
        
        Args:
            key: The cache key to set
            value: The value to cache
            expire: Optional expiration time (defaults to cache_ttl from settings)
            
        Returns:
            bool: True if the value was cached successfully, False otherwise
        """
        try:
            # Set in Redis
            await self.redis.setex(
                str(key),
                expire or settings.CACHE_TTL,
                value,
            )
            
            # Create or update in database
            cache_item = await cache_repo.get(
                self.db,
                key=str(key),
            )
            
            if cache_item:
                await cache_repo.update(
                    self.db,
                    db_obj=cache_item,
                    obj_in={
                        "value": value,
                        "expires_at": datetime.utcnow() + (expire or settings.CACHE_TTL),
                    },
                )
            else:
                await cache_repo.create(
                    self.db,
                    obj_in=CacheItemCreate(
                        key=str(key),
                        value=value,
                        expires_at=datetime.utcnow() + (expire or settings.CACHE_TTL),
                    ),
                )
            
            return True
            
        except Exception as e:
            logger.error(
                f"Error setting cache value: {str(e)}",
                exc_info=True,
                extra={
                    "key": str(key),
                },
            )
            return False
    
    async def delete(
        self,
        key: Union[str, CacheKey],
    ) -> bool:
        """Delete a cached value.
        
        Args:
            key: The cache key to delete
            
        Returns:
            bool: True if the value was deleted successfully, False otherwise
        """
        try:
            # Delete from Redis
            await self.redis.delete(str(key))
            
            # Delete from database
            cache_item = await cache_repo.get(
                self.db,
                key=str(key),
            )
            
            if cache_item:
                await cache_repo.delete(
                    self.db,
                    id=cache_item.id,
                )
            
            return True
            
        except Exception as e:
            logger.error(
                f"Error deleting cache value: {str(e)}",
                exc_info=True,
                extra={
                    "key": str(key),
                },
            )
            return False
    
    async def exists(
        self,
        key: Union[str, CacheKey],
    ) -> bool:
        """Check if a cache key exists.
        
        Args:
            key: The cache key to check
            
        Returns:
            bool: True if the key exists, False otherwise
        """
        try:
            # Check Redis first
            exists = await self.redis.exists(str(key))
            if exists:
                return True
            
            # Check database if not in Redis
            cache_item = await cache_repo.get(
                self.db,
                key=str(key),
            )
            
            return cache_item is not None
            
        except Exception as e:
            logger.error(
                f"Error checking cache key: {str(e)}",
                exc_info=True,
                extra={
                    "key": str(key),
                },
            )
            return False
    
    async def get_multi(
        self,
        keys: List[Union[str, CacheKey]],
        default: Optional[Any] = None,
    ) -> Dict[str, Optional[CacheValue]]:
        """Get multiple cached values.
        
        Args:
            keys: List of cache keys to retrieve
            default: Default value to return if key is not found
            
        Returns:
            Dict[str, Optional[CacheValue]]: Dictionary of key-value pairs
        """
        try:
            # Convert keys to strings
            str_keys = [str(key) for key in keys]
            
            # Get from Redis
            redis_values = await self.redis.mget(str_keys)
            
            # Get missing keys from database
            missing_keys = [
                key for key, value in zip(str_keys, redis_values)
                if value is None
            ]
            
            db_items = await cache_repo.get_multi(
                self.db,
                keys=missing_keys,
            )
            
            # Update Redis cache for items from database
            for item in db_items:
                if item:
                    await self.redis.setex(
                        item.key,
                        item.expires_at - datetime.utcnow(),
                        item.value,
                    )
            
            # Create the result dictionary
            result = {}
            for key, value in zip(str_keys, redis_values):
                result[key] = value if value is not None else default
            
            return result
            
        except Exception as e:
            logger.error(
                f"Error getting multiple cache values: {str(e)}",
                exc_info=True,
                extra={
                    "keys": str_keys,
                },
            )
            return {str(key): default for key in keys}
    
    async def set_multi(
        self,
        items: Dict[Union[str, CacheKey], CacheValue],
        expire: Optional[timedelta] = None,
    ) -> bool:
        """Set multiple cached values.
        
        Args:
            items: Dictionary of key-value pairs to cache
            expire: Optional expiration time (defaults to cache_ttl from settings)
            
        Returns:
            bool: True if all items were cached successfully, False otherwise
        """
        try:
            # Convert keys to strings
            str_items = {
                str(key): value for key, value in items.items()
            }
            
            # Set in Redis
            pipeline = self.redis.pipeline()
            for key, value in str_items.items():
                pipeline.setex(
                    key,
                    expire or settings.CACHE_TTL,
                    value,
                )
            await pipeline.execute()
            
            # Create or update in database
            for key, value in str_items.items():
                cache_item = await cache_repo.get(
                    self.db,
                    key=key,
                )
                
                if cache_item:
                    await cache_repo.update(
                        self.db,
                        db_obj=cache_item,
                        obj_in={
                            "value": value,
                            "expires_at": datetime.utcnow() + (expire or settings.CACHE_TTL),
                        },
                    )
                else:
                    await cache_repo.create(
                        self.db,
                        obj_in=CacheItemCreate(
                            key=key,
                            value=value,
                            expires_at=datetime.utcnow() + (expire or settings.CACHE_TTL),
                        ),
                    )
            
            return True
            
        except Exception as e:
            logger.error(
                f"Error setting multiple cache values: {str(e)}",
                exc_info=True,
                extra={
                    "keys": list(items.keys()),
                },
            )
            return False
    
    async def delete_multi(
        self,
        keys: List[Union[str, CacheKey]],
    ) -> bool:
        """Delete multiple cached values.
        
        Args:
            keys: List of cache keys to delete
            
        Returns:
            bool: True if all items were deleted successfully, False otherwise
        """
        try:
            # Convert keys to strings
            str_keys = [str(key) for key in keys]
            
            # Delete from Redis
            await self.redis.delete(*str_keys)
            
            # Delete from database
            cache_items = await cache_repo.get_multi(
                self.db,
                keys=str_keys,
            )
            
            for item in cache_items:
                if item:
                    await cache_repo.delete(
                        self.db,
                        id=item.id,
                    )
            
            return True
            
        except Exception as e:
            logger.error(
                f"Error deleting multiple cache values: {str(e)}",
                exc_info=True,
                extra={
                    "keys": str_keys,
                },
            )
            return False
    
    async def get_stats(
        self,
    ) -> Dict[str, Any]:
        """Get cache statistics.
        
        Returns:
            Dict[str, Any]: Cache statistics
        """
        try:
            # Get Redis stats
            redis_info = await self.redis.info()
            
            # Get database stats
            db_stats = await cache_repo.get_stats(
                self.db,
            )
            
            return {
                "redis": {
                    "used_memory": redis_info.get("used_memory", 0),
                    "used_memory_human": redis_info.get("used_memory_human", "0B"),
                    "keys": redis_info.get("db0", {}).get("keys", 0),
                    "expires": redis_info.get("db0", {}).get("expires", 0),
                },
                "database": {
                    "total_items": db_stats.get("total_items", 0),
                    "total_size": db_stats.get("total_size", 0),
                    "oldest_item": db_stats.get("oldest_item"),
                    "newest_item": db_stats.get("newest_item"),
                },
            }
            
        except Exception as e:
            logger.error(
                f"Error getting cache stats: {str(e)}",
                exc_info=True,
            )
            return {
                "redis": {
                    "used_memory": 0,
                    "used_memory_human": "0B",
                    "keys": 0,
                    "expires": 0,
                },
                "database": {
                    "total_items": 0,
                    "total_size": 0,
                    "oldest_item": None,
                    "newest_item": None,
                },
            }
