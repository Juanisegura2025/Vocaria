"""
Database session management for SQLAlchemy.

This module provides the database session factory and utilities for managing
database connections in an async context.
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from vocaria.config import settings

# Create async engine
engine = create_async_engine(
    str(settings.DATABASE_URI),
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=20,
    max_overflow=10,
    poolclass=NullPool if settings.ENV == "test" else None,
)

# Create async session factory
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# Base class for all models
Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async DB session.
    
    Yields:
        AsyncSession: An async database session
    """
    async with async_session_factory() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()

async def init_db() -> None:
    """Initialize database tables.
    
    This should only be used for development and testing.
    In production, use migrations instead.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
