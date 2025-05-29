"""
Application settings and configuration.

This module defines the settings for the Vocaria application using Pydantic's
BaseSettings for environment variable management and validation.
"""
import secrets
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, EmailStr, PostgresDsn, validator, Field

class Settings(BaseSettings):
    # Application
    PROJECT_NAME: str = "Vocaria API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENV: str = "development"
    DEBUG: bool = False
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    JWT_ALGORITHM: str = "HS256"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",  # Frontend dev server
        "http://localhost:8000",  # Backend dev server
    ]
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "vocaria"
    DATABASE_URI: Optional[PostgresDsn] = None
    
    @validator("DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> str:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )
    
    # Email
    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[EmailStr] = "noreply@vocaria.app"
    EMAILS_FROM_NAME: Optional[str] = "Vocaria"
    
    # ElevenLabs
    ELEVEN_API_KEY: Optional[str] = None
    ELEVEN_API_URL: str = "https://api.elevenlabs.io/v1"
    
    # Matterport
    MATTERPORT_API_KEY: Optional[str] = None
    
    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PRICE_ID: Optional[str] = None
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Sentry
    SENTRY_DSN: Optional[str] = None
    
    # Security Headers
    SECURE_HSTS_SECONDS: int = 60 * 60 * 24 * 365  # 1 year
    SECURE_CORS_ORIGINS: List[str] = ["*"]
    
    # Rate Limiting
    RATE_LIMIT: str = "100/minute"
    
    # Model configuration
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

# Global settings instance
settings = Settings()
