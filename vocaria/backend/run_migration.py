"""
Run database migration using Python instead of psql
"""
import asyncio
from src.database import get_db

async def run_migration():
    print("🔧 Running database migration...")
    
    migration_sql = """
    ALTER TABLE properties 
    ADD COLUMN IF NOT EXISTS matterport_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS matterport_description TEXT,
    ADD COLUMN IF NOT EXISTS matterport_visibility VARCHAR(50),
    ADD COLUMN IF NOT EXISTS matterport_created_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS matterport_modified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(200),
    ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(200),
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS country VARCHAR(100),
    ADD COLUMN IF NOT EXISTS total_area_floor FLOAT,
    ADD COLUMN IF NOT EXISTS total_area_floor_indoor FLOAT,
    ADD COLUMN IF NOT EXISTS total_volume FLOAT,
    ADD COLUMN IF NOT EXISTS dimension_units VARCHAR(20) DEFAULT 'metric',
    ADD COLUMN IF NOT EXISTS rooms_data JSON,
    ADD COLUMN IF NOT EXISTS floors_data JSON,
    ADD COLUMN IF NOT EXISTS share_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS embed_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS matterport_import_success BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS matterport_import_errors JSON,
    ADD COLUMN IF NOT EXISTS last_matterport_sync TIMESTAMPTZ;
    """
    
    async for db in get_db():
        try:
            # Execute migration SQL commands one by one
            commands = migration_sql.strip().split(',')
            first_command = commands[0] + ','
            
            # Execute the full ALTER TABLE statement
            from sqlalchemy import text
            await db.execute(text(migration_sql))
            await db.commit()
            print("✅ Migration completed successfully!")
            
            # Verify columns exist
            result = await db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'properties' 
                AND column_name IN ('total_area_floor_indoor', 'rooms_data', 'matterport_name')
                ORDER BY column_name;
            """))
            
            columns = result.fetchall()
            print(f"✅ Verified {len(columns)} new columns added:")
            for col in columns:
                print(f"  - {col[0]}")
                
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            await db.rollback()
        
        break

if __name__ == "__main__":
    asyncio.run(run_migration())
