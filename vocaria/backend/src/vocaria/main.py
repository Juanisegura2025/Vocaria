"""
Vocaria FastAPI Application

This module initializes the FastAPI application with all the necessary configurations,
middleware, and API routes for the Vocaria backend service.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from vocaria.config.settings import settings
from vocaria.api.v1.api import api_router
from vocaria.core.logging import setup_logging
from vocaria.db.session import engine, Base

# Initialize logging
setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI application.
    
    Handles startup and shutdown events for the application.
    """
    logger.info("Starting up...")
    
    # Create database tables (in production, use migrations instead)
    if settings.ENV == "development":
        logger.info("Creating database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Clean up resources
    logger.info("Shutting down...")
    await engine.dispose()

# Initialize FastAPI application
app = FastAPI(
    title="Vocaria API",
    description="API for Vocaria voice-first virtual showing assistant",
    version="1.0.0",
    docs_url="/docs" if settings.ENV != "production" else None,
    redoc_url="/redoc" if settings.ENV != "production" else None,
    openapi_url="/openapi.json" if settings.ENV != "production" else None,
    lifespan=lifespan,
)

# Add CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors in requests."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": {
                "errors": exc.errors(),
                "body": exc.body,
            },
            "message": "Validation Error",
        },
    )

@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    """Handle Pydantic validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.errors(),
            "message": "Validation Error",
        },
    )

# Include API routers
app.include_router(api_router, prefix="/api/v1")

# Login endpoint
@app.post("/api/users/login")
async def login_user(
    credentials: dict,
    db: AsyncSession = Depends(get_db)
):
    """Login endpoint for user authentication.
    
    Args:
        credentials: Dictionary containing email and password
        db: Database session
        
    Returns:
        dict: User data
        
    Raises:
        HTTPException: If credentials are invalid or error occurs
    """
    try:
        email = credentials.get("email")
        password = credentials.get("password")
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email y password requeridos")
        
        # Buscar usuario por email
        result = await db.execute(
            select(User).where(User.email == email)
        )
        user_result = result.first()
        
        if not user_result:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        
        user = user_result[0]
        
        # Verificar password
        if user.hashed_password != hash_password(password):
            raise HTTPException(status_code=401, detail="Password incorrecto")
        
        return {
            "id": user.id,
            "email": user.email,
            "username": user.email,  # Using email as username
            "full_name": user.full_name,
            "is_active": user.is_active
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en login: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": settings.ENV,
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Vocaria API",
        "version": "1.0.0",
        "docs": "/docs" if settings.ENV != "production" else None,
    }