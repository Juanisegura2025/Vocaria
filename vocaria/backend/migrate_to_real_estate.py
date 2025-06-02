import asyncio
import asyncpg

async def migrate_database():
    print("🔄 Iniciando migración a schema inmobiliario...")
    
    # Conectar a la base de datos
    connection_string = "postgresql://vocaria_user:Ciri13to@localhost:5432/vocaria_dev"
    conn = await asyncpg.connect(connection_string)
    
    try:
        print("✅ Conectado a la base de datos")
        
        # Crear nuevas tablas inmobiliarias
        print("📋 Creando nuevas tablas inmobiliarias...")
        
        # Tours table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS tours (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER REFERENCES users(id),
                name VARCHAR(200) NOT NULL,
                matterport_model_id VARCHAR(100) NOT NULL,
                agent_id VARCHAR(100),
                agent_objective TEXT DEFAULT 'Schedule a visit',
                is_active BOOLEAN DEFAULT true,
                room_data JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """)
        
        # Leads table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
                tour_id INTEGER REFERENCES tours(id),
                email VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                room_context JSONB,
                lead_data JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        
        # Properties table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS properties (
                id SERIAL PRIMARY KEY,
                tour_id INTEGER REFERENCES tours(id),
                address VARCHAR(200),
                price DECIMAL,
                bedrooms INTEGER,
                bathrooms INTEGER,
                area_m2 DECIMAL,
                property_type VARCHAR(50),
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        
        # Actualizar tabla users con nuevos campos
        print("🔧 Actualizando tabla users...")
        await conn.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS company_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial'
        """)
        
        print("✅ Migración completada exitosamente!")
        
        # Verificar tablas creadas
        tables = await conn.fetch("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        
        print("📋 Tablas en la base de datos:")
        for table in tables:
            print(f"  - {table['table_name']}")
            
    except Exception as e:
        print(f"❌ Error en migración: {e}")
        raise
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate_database())
