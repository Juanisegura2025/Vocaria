"""
Authentication and authorization service.

This module provides services for user authentication, token generation,
and authorization checks.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from vocaria.core.config import settings
from vocaria.db.models import User
from vocaria.db.repositories.user import user_repo
from vocaria.schemas.token import TokenPayload
from vocaria.schemas.user import UserInDB

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash.
    
    Args:
        plain_password: The password to verify
        hashed_password: The hash to verify against
        
    Returns:
        bool: True if the password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate a password hash.
    
    Args:
        password: The password to hash
        
    Returns:
        str: The hashed password
    """
    return pwd_context.hash(password)

def create_access_token(
    subject: Union[str, Any], 
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token.
    
    Args:
        subject: The subject of the token (usually a user ID)
        expires_delta: Optional expiration time delta
        
    Returns:
        str: The encoded JWT token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

async def get_current_user(
    db: AsyncSession = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
) -> User:
    """Get the current user from a JWT token.
    
    Args:
        db: Database session
        token: JWT token
        
    Returns:
        User: The authenticated user
        
    Raises:
        HTTPException: If the token is invalid or the user doesn't exist
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
            algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise credentials_exception
    
    user = await user_repo.get(db, id=token_data.sub)
    if user is None:
        raise credentials_exception
        
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get the current active user.
    
    Args:
        current_user: The current user from the JWT token
        
    Returns:
        User: The active user
        
    Raises:
        HTTPException: If the user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get the current active superuser.
    
    Args:
        current_user: The current user from the JWT token
        
    Returns:
        User: The active superuser
        
    Raises:
        HTTPException: If the user is not a superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=400, 
            detail="The user doesn't have enough privileges"
        )
    return current_user

async def authenticate(
    db: AsyncSession, 
    email: str, 
    password: str
) -> Optional[User]:
    """Authenticate a user.
    
    Args:
        db: Database session
        email: User's email
        password: Plain text password
        
    Returns:
        Optional[User]: The authenticated user if successful, None otherwise
    """
    user = await user_repo.get_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def generate_password_reset_token(email: str) -> str:
    """Generate a password reset token.
    
    Args:
        email: The user's email
        
    Returns:
        str: The encoded JWT token
    """
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.utcnow()
    expires = now + delta
    
    to_encode = {
        "exp": expires,
        "nbf": now,
        "sub": email,
        "type": "password_reset"
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt

async def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify a password reset token and return the email if valid.
    
    Args:
        token: The JWT token to verify
        
    Returns:
        Optional[str]: The email from the token if valid, None otherwise
    """
    try:
        decoded_token = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        if decoded_token["type"] != "password_reset":
            return None
        return decoded_token["sub"]
    except JWTError:
        return None

async def get_db() -> AsyncSession:
    """Get a database session.
    
    Yields:
        AsyncSession: Database session
    """
    from vocaria.db.session import AsyncSessionLocal
    
    async with AsyncSessionLocal() as session:
        yield session
