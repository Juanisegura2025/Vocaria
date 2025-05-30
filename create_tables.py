import asyncio
import os
import sys
sys.path.append('./vocaria/backend')
from src.models import Base
from sqlalchemy.ext.asyncio import create_async_engine

async def create_tables():
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://vocaria_user:Ciri13to@localhost:5432/vocaria_dev")
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    await engine.dispose()
    print("✅ Tables created successfully!")

if __name__ == "__main__":
    asyncio.run(create_tables())
