## Scripts de Validación para Vocaria

Estos scripts los puede generar Windsurf automáticamente. Crealos en la carpeta `scripts/` del proyecto.

### scripts/validate_env.py

```python
#!/usr/bin/env python3
"""
Environment validation script for Vocaria.
Checks that all required environment variables are set and valid.
"""

import os
import sys
from urllib.parse import urlparse
from typing import Dict, List, Optional
import re

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_success(msg: str):
    print(f"{Colors.GREEN}✓{Colors.ENDC} {msg}")

def print_error(msg: str):
    print(f"{Colors.RED}✗{Colors.ENDC} {msg}")

def print_warning(msg: str):
    print(f"{Colors.YELLOW}⚠{Colors.ENDC} {msg}")

def print_info(msg: str):
    print(f"{Colors.BLUE}ℹ{Colors.ENDC} {msg}")

def validate_url(url: str) -> bool:
    """Validate URL format"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_jwt_secret(secret: str) -> bool:
    """Validate JWT secret strength"""
    return len(secret) >= 32 and not secret.startswith('your-')

def check_required_vars() -> Dict[str, bool]:
    """Check all required environment variables"""
    required_vars = {
        # Application
        'APP_ENV': {'validator': lambda x: x in ['development', 'staging', 'production']},
        'SECRET_KEY': {'validator': lambda x: len(x) >= 32 and not x.startswith('your-')},
        
        # Database
        'DATABASE_URL': {'validator': lambda x: x.startswith('postgresql://') or x.startswith('postgres://')},
        
        # ElevenLabs
        'ELEVEN_API_KEY': {'validator': lambda x: len(x) > 20 and not x.startswith('your-')},
        
        # Matterport
        'MATTERPORT_API_KEY': {'validator': lambda x: len(x) > 10 and not x.startswith('your-')},
        
        # Stripe
        'STRIPE_SECRET_KEY': {'validator': lambda x: x.startswith('sk_') and len(x) > 20},
        'STRIPE_PUBLISHABLE_KEY': {'validator': lambda x: x.startswith('pk_') and len(x) > 20},
        
        # JWT
        'JWT_SECRET_KEY': {'validator': validate_jwt_secret},
    }
    
    optional_vars = {
        'REDIS_URL': {'validator': validate_url, 'default': 'redis://localhost:6379/0'},
        'SENTRY_DSN': {'validator': validate_url, 'default': None},
        'FROM_EMAIL': {'validator': validate_email, 'default': 'noreply@vocaria.app'},
    }
    
    results = {}
    
    print(f"{Colors.BOLD}🔍 Checking required environment variables...{Colors.ENDC}\n")
    
    # Check required variables
    for var_name, config in required_vars.items():
        value = os.getenv(var_name)
        if not value:
            print_error(f"{var_name} is not set")
            results[var_name] = False
        elif not config['validator'](value):
            print_error(f"{var_name} is invalid")
            results[var_name] = False
        else:
            print_success(f"{var_name} is valid")
            results[var_name] = True
    
    print()
    
    # Check optional variables
    print(f"{Colors.BOLD}📋 Checking optional environment variables...{Colors.ENDC}\n")
    
    for var_name, config in optional_vars.items():
        value = os.getenv(var_name)
        if not value:
            if config['default']:
                print_warning(f"{var_name} not set, will use default: {config['default']}")
            else:
                print_warning(f"{var_name} not set (optional)")
            results[var_name] = True  # Optional vars don't fail validation
        elif not config['validator'](value):
            print_error(f"{var_name} is invalid")
            results[var_name] = False
        else:
            print_success(f"{var_name} is valid")
            results[var_name] = True
    
    return results

def check_environment_consistency():
    """Check for environment-specific consistency"""
    app_env = os.getenv('APP_ENV', 'development')
    
    print(f"\n{Colors.BOLD}🔄 Environment consistency checks...{Colors.ENDC}\n")
    
    if app_env == 'production':
        # Production checks
        if os.getenv('DEBUG', 'false').lower() == 'true':
            print_error("DEBUG should be false in production")
            return False
        
        if os.getenv('SECRET_KEY', '').startswith('your-'):
            print_error("SECRET_KEY must be changed from default in production")
            return False
        
        stripe_key = os.getenv('STRIPE_SECRET_KEY', '')
        if stripe_key.startswith('sk_test_'):
            print_error("Using test Stripe keys in production")
            return False
        
        print_success("Production environment checks passed")
    
    elif app_env == 'development':
        # Development checks
        stripe_key = os.getenv('STRIPE_SECRET_KEY', '')
        if stripe_key.startswith('sk_live_'):
            print_warning("Using live Stripe keys in development")
        
        print_success("Development environment checks passed")
    
    return True

def main():
    """Main validation function"""
    print(f"{Colors.BOLD}{Colors.BLUE}🚀 Vocaria Environment Validation{Colors.ENDC}\n")
    
    # Load .env file if it exists
    env_file = '.env'
    if os.path.exists(env_file):
        print_info(f"Loading environment from {env_file}")
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            print_warning("python-dotenv not installed, skipping .env file loading")
    
    # Run validations
    var_results = check_required_vars()
    env_consistency = check_environment_consistency()
    
    # Summary
    print(f"\n{Colors.BOLD}📊 Validation Summary{Colors.ENDC}\n")
    
    total_vars = len(var_results)
    valid_vars = sum(var_results.values())
    
    if valid_vars == total_vars and env_consistency:
        print_success(f"All {total_vars} variables are valid! ✨")
        print_info("Environment is ready for Vocaria development")
        sys.exit(0)
    else:
        invalid_count = total_vars - valid_vars
        print_error(f"{invalid_count} variables need attention")
        print_info("Please fix the issues above before starting development")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### scripts/test_connections.py

```python
#!/usr/bin/env python3
"""
Connection testing script for Vocaria external services.
Tests connectivity to all required external APIs.
"""

import asyncio
import aiohttp
import os
from typing import Dict, Any
import json
import sys

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

async def test_database_connection():
    """Test PostgreSQL connection"""
    try:
        import asyncpg
        database_url = os.getenv('DATABASE_URL')
        
        conn = await asyncpg.connect(database_url)
        result = await conn.fetchval('SELECT version()')
        await conn.close()
        
        return {
            'service': 'PostgreSQL',
            'status': 'success',
            'details': f"Connected: {result.split()[0]} {result.split()[1]}"
        }
    except Exception as e:
        return {
            'service': 'PostgreSQL',
            'status': 'error',
            'details': str(e)
        }

async def test_redis_connection():
    """Test Redis connection"""
    try:
        import redis.asyncio as redis
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        
        r = redis.from_url(redis_url)
        await r.ping()
        info = await r.info()
        await r.close()
        
        return {
            'service': 'Redis',
            'status': 'success',
            'details': f"Connected: Redis {info['redis_version']}"
        }
    except Exception as e:
        return {
            'service': 'Redis',
            'status': 'error',
            'details': str(e)
        }

async def test_elevenlabs_api():
    """Test ElevenLabs API connection"""
    api_key = os.getenv('ELEVEN_API_KEY')
    if not api_key or api_key.startswith('your-'):
        return {
            'service': 'ElevenLabs',
            'status': 'skip',
            'details': 'API key not configured'
        }
    
    try:
        async with aiohttp.ClientSession() as session:
            headers = {'Xi-Api-Key': api_key}
            async with session.get('https://api.elevenlabs.io/v1/user', headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        'service': 'ElevenLabs',
                        'status': 'success',
                        'details': f"Connected: User {data.get('first_name', 'Unknown')}"
                    }
                else:
                    return {
                        'service': 'ElevenLabs',
                        'status': 'error',
                        'details': f"HTTP {response.status}: {await response.text()}"
                    }
    except Exception as e:
        return {
            'service': 'ElevenLabs',
            'status': 'error',
            'details': str(e)
        }

async def test_matterport_api():
    """Test Matterport API connection"""
    api_key = os.getenv('MATTERPORT_API_KEY')
    if not api_key or api_key.startswith('your-'):
        return {
            'service': 'Matterport',
            'status': 'skip',
            'details': 'API key not configured'
        }
    
    try:
        async with aiohttp.ClientSession() as session:
            headers = {'Authorization': f'Bearer {api_key}'}
            async with session.get('https://api.matterport.com/api/mp/models', headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    model_count = len(data.get('results', []))
                    return {
                        'service': 'Matterport',
                        'status': 'success',
                        'details': f"Connected: {model_count} models accessible"
                    }
                else:
                    return {
                        'service': 'Matterport',
                        'status': 'error',
                        'details': f"HTTP {response.status}: {await response.text()}"
                    }
    except Exception as e:
        return {
            'service': 'Matterport',
            'status': 'error',
            'details': str(e)
        }

async def test_stripe_api():
    """Test Stripe API connection"""
    api_key = os.getenv('STRIPE_SECRET_KEY')
    if not api_key or api_key.startswith('your-'):
        return {
            'service': 'Stripe',
            'status': 'skip',
            'details': 'API key not configured'
        }
    
    try:
        import stripe
        stripe.api_key = api_key
        
        account = stripe.Account.retrieve()
        return {
            'service': 'Stripe',
            'status': 'success',
            'details': f"Connected: {account.business_profile.name or 'Account'} ({account.country})"
        }
    except Exception as e:
        return {
            'service': 'Stripe',
            'status': 'error',
            'details': str(e)
        }

def print_result(result: Dict[str, Any]):
    """Print formatted test result"""
    service = result['service']
    status = result['status']
    details = result['details']
    
    if status == 'success':
        print(f"{Colors.GREEN}✓{Colors.ENDC} {service:<15} {details}")
    elif status == 'error':
        print(f"{Colors.RED}✗{Colors.ENDC} {service:<15} {details}")
    elif status == 'skip':
        print(f"{Colors.YELLOW}⚠{Colors.ENDC} {service:<15} {details}")

async def main():
    """Main connection testing function"""
    print(f"{Colors.BOLD}{Colors.BLUE}🔌 Vocaria Connection Tests{Colors.ENDC}\n")
    
    # Load environment
    if os.path.exists('.env'):
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass
    
    # Define all tests
    tests = [
        test_database_connection(),
        test_redis_connection(),
        test_elevenlabs_api(),
        test_matterport_api(),
        test_stripe_api(),
    ]
    
    # Run all tests concurrently
    results = await asyncio.gather(*tests, return_exceptions=True)
    
    # Process results
    success_count = 0
    error_count = 0
    skip_count = 0
    
    for result in results:
        if isinstance(result, Exception):
            print_result({
                'service': 'Unknown',
                'status': 'error',
                'details': str(result)
            })
            error_count += 1
        else:
            print_result(result)
            if result['status'] == 'success':
                success_count += 1
            elif result['status'] == 'error':
                error_count += 1
            else:
                skip_count += 1
    
    # Summary
    print(f"\n{Colors.BOLD}📊 Connection Summary{Colors.ENDC}")
    print(f"✅ Successful: {success_count}")
    print(f"❌ Failed: {error_count}")
    print(f"⚠️  Skipped: {skip_count}")
    
    if error_count > 0:
        print(f"\n{Colors.RED}Some connections failed. Check your configuration.{Colors.ENDC}")
        sys.exit(1)
    else:
        print(f"\n{Colors.GREEN}All available services are connected! 🎉{Colors.ENDC}")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())
```

### scripts/migrate.py

```python
#!/usr/bin/env python3
"""
Database migration script for Vocaria.
Applies SQL migrations in order.
"""

import asyncio
import asyncpg
import os
import sys
from pathlib import Path
from typing import List
import hashlib

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

class Migration:
    def __init__(self, filepath: Path):
        self.filepath = filepath
        self.name = filepath.stem
        self.content = filepath.read_text()
        self.checksum = hashlib.md5(self.content.encode()).hexdigest()

async def create_migrations_table(conn: asyncpg.Connection):
    """Create migrations tracking table if it doesn't exist"""
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            checksum TEXT NOT NULL,
            applied_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)

async def get_applied_migrations(conn: asyncpg.Connection) -> List[str]:
    """Get list of already applied migrations"""
    rows = await conn.fetch("SELECT name FROM migrations ORDER BY applied_at")
    return [row['name'] for row in rows]

async def apply_migration(conn: asyncpg.Connection, migration: Migration):
    """Apply a single migration"""
    print(f"{Colors.BLUE}📝{Colors.ENDC} Applying migration: {migration.name}")
    
    try:
        async with conn.transaction():
            # Execute migration SQL
            await conn.execute(migration.content)
            
            # Record migration as applied
            await conn.execute(
                "INSERT INTO migrations (name, checksum) VALUES ($1, $2)",
                migration.name, migration.checksum
            )
        
        print(f"{Colors.GREEN}✓{Colors.ENDC} Applied: {migration.name}")
        
    except Exception as e:
        print(f"{Colors.RED}✗{Colors.ENDC} Failed to apply {migration.name}: {e}")
        raise

def load_migrations() -> List[Migration]:
    """Load all migration files from migrations directory"""
    migrations_dir = Path('migrations')
    
    if not migrations_dir.exists():
        print(f"{Colors.YELLOW}⚠{Colors.ENDC} No migrations directory found")
        return []
    
    migration_files = sorted(migrations_dir.glob('*.sql'))
    migrations = [Migration(f) for f in migration_files]
    
    print(f"{Colors.BLUE}📁{Colors.ENDC} Found {len(migrations)} migration files")
    
    return migrations

async def main():
    """Main migration function"""
    print(f"{Colors.BOLD}{Colors.BLUE}🗄️  Vocaria Database Migrations{Colors.ENDC}\n")
    
    # Load environment
    if os.path.exists('.env'):
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print(f"{Colors.RED}✗{Colors.ENDC} DATABASE_URL not set")
        sys.exit(1)
    
    try:
        # Connect to database
        conn = await asyncpg.connect(database_url)
        print(f"{Colors.GREEN}✓{Colors.ENDC} Connected to database")
        
        # Setup migrations table
        await create_migrations_table(conn)
        
        # Load migrations
        migrations = load_migrations()
        if not migrations:
            print(f"{Colors.YELLOW}⚠{Colors.ENDC} No migrations to apply")
            return
        
        # Get applied migrations
        applied = await get_applied_migrations(conn)
        print(f"{Colors.BLUE}📋{Colors.ENDC} {len(applied)} migrations already applied")
        
        # Apply pending migrations
        pending = [m for m in migrations if m.name not in applied]
        
        if not pending:
            print(f"{Colors.GREEN}✅{Colors.ENDC} Database is up to date!")
        else:
            print(f"{Colors.BLUE}⏳{Colors.ENDC} Applying {len(pending)} pending migrations...\n")
            
            for migration in pending:
                await apply_migration(conn, migration)
            
            print(f"\n{Colors.GREEN}🎉{Colors.ENDC} All migrations applied successfully!")
        
        await conn.close()
        
    except Exception as e:
        print(f"{Colors.RED}✗{Colors.ENDC} Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
```

### Makefile

```makefile
# Vocaria Development Commands
.PHONY: help setup test lint clean dev build deploy

# Default target
help:
	@echo "🚀 Vocaria Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  setup          Install all dependencies and setup environment"
	@echo "  setup-db       Initialize database with migrations"
	@echo ""
	@echo "Development:"
	@echo "  dev            Start development servers (backend + frontend)"
	@echo "  dev-backend    Start only backend server"
	@echo "  dev-frontend   Start only frontend server"
	@echo ""
	@echo "Testing:"
	@echo "  test           Run all tests"
	@echo "  test-backend   Run backend tests only"
	@echo "  test-frontend  Run frontend tests only"
	@echo "  test-e2e       Run E2E tests"
	@echo ""
	@echo "Quality:"
	@echo "  lint           Run all linters"
	@echo "  format         Format all code"
	@echo "  type-check     Run type checking"
	@echo ""
	@echo "Validation:"
	@echo "  validate-env   Check environment variables"
	@echo "  test-connections Test external API connections"
	@echo ""
	@echo "Deployment:"
	@echo "  build          Build for production"
	@echo "  deploy-staging Deploy to staging"
	@echo "  deploy-prod    Deploy to production"

# Setup commands
setup:
	@echo "🔧 Setting up Vocaria development environment..."
	pip install -r requirements.txt -r requirements-dev.txt
	cd frontend && pnpm install
	cp .env.example .env
	@echo "✅ Setup complete! Edit .env with your API keys."

setup-db:
	@echo "🗄️  Setting up database..."
	python scripts/migrate.py
	@echo "✅ Database setup complete!"

# Development servers
dev:
	@echo "🚀 Starting Vocaria development servers..."
	@trap 'kill %1; kill %2' EXIT; \
	python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 & \
	cd frontend && pnpm dev --port 3000 & \
	wait

dev-backend:
	python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && pnpm dev

# Testing
test: test-backend test-frontend

test-backend:
	@echo "🧪 Running backend tests..."
	pytest tests/ -v --cov=src --cov-report=term --cov-report=html

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && pnpm test --watchAll=false

test-e2e:
	@echo "🎭 Running E2E tests..."
	cd frontend && pnpm exec playwright test

# Code quality
lint:
	@echo "🔍 Running linters..."
	ruff check src/ tests/
	black --check src/ tests/
	mypy src/
	cd frontend && pnpm lint

format:
	@echo "💅 Formatting code..."
	black src/ tests/
	ruff --fix src/ tests/
	cd frontend && pnpm format

type-check:
	@echo "🔎 Type checking..."
	mypy src/
	cd frontend && pnpm type-check

# Validation
validate-env:
	@echo "🔍 Validating environment..."
	python scripts/validate_env.py

test-connections:
	@echo "🔌 Testing API connections..."
	python scripts/test_connections.py

# Build and deployment
build:
	@echo "🏗️  Building for production..."
	cd frontend && pnpm build
	docker build -t vocaria:latest .

deploy-staging:
	@echo "🚀 Deploying to staging..."
	flyctl deploy --config fly.staging.toml

deploy-prod:
	@echo "🚀 Deploying to production..."
	flyctl deploy --config fly.toml

# Cleanup
clean:
	@echo "🧹 Cleaning up..."
	rm -rf __pycache__ .pytest_cache .coverage htmlcov
	rm -rf frontend/dist frontend/coverage
	docker system prune -f

# Database operations
db-reset:
	@echo "⚠️  Resetting database (destructive!)..."
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $REPLY =~ ^[Yy]$ ]]; then \
		python scripts/reset_db.py; \
		python scripts/migrate.py; \
	fi

db-backup:
	@echo "💾 Creating database backup..."
	@DATE=$(date +%Y%m%d_%H%M%S); \
	pg_dump ${DATABASE_URL} > backup_$DATE.sql; \
	echo "✅ Backup created: backup_$DATE.sql"

# Performance testing
perf-test:
	@echo "⚡ Running performance tests..."
	k6 run tests/performance/load-test.js

# Security scanning
security-scan:
	@echo "🔒 Running security scan..."
	bandit -r src/
	cd frontend && pnpm audit
	
# Documentation
docs-build:
	@echo "📚 Building documentation..."
	cd docs && mkdocs build

docs-serve:
	@echo "📚 Serving documentation..."
	cd docs && mkdocs serve
```

### requirements-dev.txt

```txt
# Development dependencies for Vocaria

# Testing
pytest>=8.0.0
pytest-asyncio>=0.23.0
pytest-cov>=4.0.0
pytest-mock>=3.12.0
httpx>=0.27.0  # For testing API calls

# Code quality
black>=24.0.0
ruff>=0.6.0
mypy>=1.8.0
bandit>=1.7.0
pre-commit>=3.6.0

# Database testing
pytest-postgresql>=5.0.0
asyncpg>=0.29.0

# Environment management
python-dotenv>=1.0.0

# Performance testing
locust>=2.20.0

# Documentation
mkdocs>=1.5.0
mkdocs-material>=9.4.0

# Debugging
ipdb>=0.13.0
rich>=13.7.0

# Type stubs
types-redis>=4.6.0
types-requests>=2.31.0
```

### package.json (Frontend)

```json
{
  "name": "vocaria-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 3000",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css,md}\"",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "@tanstack/react-query": "^5.51.0",
    "zustand": "^4.5.0",
    "recharts": "^2.12.0",
    "@elevenlabs/web": "^0.3.0",
    "lucide-react": "^0.263.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@playwright/test": "^1.48.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitest/ui": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.9.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.0",
    "prettier": "^3.3.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

### Dockerfile

```dockerfile
# Multi-stage build for Vocaria
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY frontend/ .
RUN pnpm build

# Python backend
FROM python:3.12-slim AS backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./static/

# Create non-root user
RUN useradd --create-home --shell /bin/bash vocaria
USER vocaria

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```