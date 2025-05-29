"""
Security utilities for authentication and authorization.

This module provides functions for password hashing, JWT token generation,
and other security-related functionality.
"""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Dict, Any

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from vocaria.config import settings
from vocaria.db.session import get_db
from vocaria.db.models import User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to verify against
        
    Returns:
        bool: True if password is valid, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token.
    
    Args:
        subject: Subject to include in the token (typically user ID)
        expires_delta: Optional timedelta for token expiration
        
    Returns:
        str: Encoded JWT token
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db=Depends(get_db),
) -> User:
    """Get the current authenticated user from a JWT token.
    
    Args:
        token: JWT token from Authorization header
        db: Database session
        
    Returns:
        User: Authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    user = await db.get(User, user_id)
    if user is None:
        raise credentials_exception
    
    return user

def generate_password_reset_token(email: str) -> str:
    """Generate a password reset token.
    
    Args:
        email: User's email address
        
    Returns:
        str: JWT token for password reset
    """
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now(timezone.utc)
    expires = now + delta
    
    to_encode = {"exp": expires, "nbf": now, "sub": email}
    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify a password reset token.
    
    Args:
        token: JWT token to verify
        
    Returns:
        Optional[str]: Email address if token is valid, None otherwise
    """
    try:
        decoded_token = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return decoded_token["sub"]
    except JWTError:
        return None

def generate_email_verification_token(email: str) -> str:
    """Generate an email verification token.
    
    Args:
        email: User's email address
        
    Returns:
        str: JWT token for email verification
    """
    delta = timedelta(hours=24)  # 24 hours for email verification
    now = datetime.now(timezone.utc)
    expires = now + delta
    
    to_encode = {
        "exp": expires,
        "nbf": now,
        "sub": email,
        "type": "email_verification",
    }
    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

def generate_widget_auth_token(tour_id: str, expires_in_minutes: int = 60) -> str:
    """Generate a widget authentication token for a specific tour.
    
    Args:
        tour_id: ID of the tour to generate token for
        expires_in_minutes: Token expiration time in minutes (default: 60)
        
    Returns:
        str: JWT token for widget authentication
    """
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=expires_in_minutes)
    
    to_encode = {
        "exp": expires,
        "nbf": now,
        "sub": "widget",
        "tour_id": str(tour_id),
    }
    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
