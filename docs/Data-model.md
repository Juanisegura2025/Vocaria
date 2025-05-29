```mermaid
erDiagram
    users ||--o{ tours : "1:n"
    tours ||--o{ leads : "1:n"
    tours ||--o{ usages : "1:n"
    tours ||--o{ conversations : "1:n"
    
    users {
        uuid id PK
        string email
        string full_name
        string stripe_customer_id
        jsonb subscription_data
        timestamptz created_at
        timestamptz updated_at
    }
    
    tours {
        uuid id PK
        uuid owner_id FK
        string name
        string matterport_model_id
        string agent_id
        string agent_objective
        boolean is_active
        jsonb room_data
        timestamptz created_at
        timestamptz updated_at
    }
    
    leads {
        uuid id PK
        uuid tour_id FK
        string email
        string phone
        jsonb room_context
        jsonb metadata
        vector embedding
        timestamptz created_at
    }
    
    usages {
        uuid id PK
        uuid tour_id FK
        numeric minutes_tts
        integer messages
        integer leads_count
        date window_start
        date window_end
        timestamptz updated_at
    }
    
    conversations {
        uuid id PK
        uuid tour_id FK
        uuid lead_id FK
        jsonb messages
        numeric duration_seconds
        string session_id
        timestamptz started_at
        timestamptz ended_at
    }
```

### Table definitions (SQL)

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (admin panel authentication)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  password_hash text NOT NULL,
  stripe_customer_id text UNIQUE,
  subscription_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tours table
CREATE TABLE tours (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  matterport_model_id text NOT NULL,
  agent_id text NOT NULL,
  agent_objective text DEFAULT 'Schedule a visit',
  is_active boolean DEFAULT true,
  room_data jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT tours_name_owner_unique UNIQUE(name, owner_id)
);

-- Leads table
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,
  email text NOT NULL,
  phone text,
  room_context jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  embedding vector(384),
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT leads_email_tour_unique UNIQUE(email, tour_id)
);

-- Usage tracking table
CREATE TABLE usages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,
  minutes_tts numeric DEFAULT 0,
  messages integer DEFAULT 0,
  leads_count integer DEFAULT 0,
  window_start date NOT NULL,
  window_end date NOT NULL,
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT usages_tour_window_unique UNIQUE(tour_id, window_start, window_end)
);

-- Conversations table (for analytics and debugging)
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  messages jsonb DEFAULT '[]',
  duration_seconds numeric DEFAULT 0,
  session_id text NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  
  CONSTRAINT conversations_session_unique UNIQUE(session_id)
);

-- Indexes for performance
CREATE INDEX idx_tours_owner_id ON tours(owner_id);
CREATE INDEX idx_tours_active ON tours(is_active) WHERE is_active = true;
CREATE INDEX idx_leads_tour_id ON leads(tour_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_usages_tour_window ON usages(tour_id, window_start, window_end);
CREATE INDEX idx_conversations_tour_id ON conversations(tour_id);
CREATE INDEX idx_conversations_started_at ON conversations(started_at);

-- Vector similarity search index
CREATE INDEX idx_leads_embedding ON leads USING hnsw (embedding vector_cosine_ops);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON tours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usages_updated_at BEFORE UPDATE ON usages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Seed data for development

```sql
-- Development user
INSERT INTO users (email, full_name, password_hash) 
VALUES ('dev@vocaria.app', 'Dev User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewQ5xHgIlw1jGiGi');

-- Sample tour
INSERT INTO tours (owner_id, name, matterport_model_id, agent_id)
VALUES (
  (SELECT id FROM users WHERE email = 'dev@vocaria.app'),
  'Demo Apartment CABA',
  'SxQL3iGyoDo',
  'demo-agent-id'
);
```

### Database migrations structure

```
migrations/
├── 001_initial_schema.sql
├── 002_add_vector_extension.sql
├── 003_add_conversations_table.sql
└── 004_add_indexes.sql
```

### Connection pooling and performance

```python
# Database configuration for FastAPI
DATABASE_URL = "postgresql://user:pass@localhost/vocaria"
DATABASE_POOL_SIZE = 20
DATABASE_MAX_OVERFLOW = 30
DATABASE_POOL_TIMEOUT = 30
DATABASE_POOL_RECYCLE = 3600
```