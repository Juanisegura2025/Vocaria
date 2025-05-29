"""
Authentication API endpoints.

This module contains the FastAPI endpoints for user authentication.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from vocaria.core.config import settings
from vocaria.db.models import User
from vocaria.db.repositories.user import user_repo
from vocaria.services.auth import AuthService
from vocaria.schemas.auth import (
    Token,
    TokenData,
    UserCreate,
    UserUpdate,
    UserInDB,
)

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(user_repo.get_db),
) -> User:
    """Get the current authenticated user.
    
    Args:
        token: The JWT token
        db: Database session
        
    Returns:
        User: The authenticated user
        
    Raises:
        HTTPException: If the token is invalid or the user is not found
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token_data = TokenData(username=username)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await user_repo.get(db, email=token_data.username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(user_repo.get_db),
) -> Dict[str, str]:
    """Login user and return access token.
    
    Args:
        form_data: Login form data
        db: Database session
        
    Returns:
        Dict[str, str]: Access token and token type
        
    Raises:
        HTTPException: If authentication fails
    """
    auth_service = AuthService(db)
    user = await auth_service.authenticate_user(
        email=form_data.username,
        password=form_data.password,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires,
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserInDB)
async def register_user(
    user: UserCreate,
    db: AsyncSession = Depends(user_repo.get_db),
) -> User:
    """Register a new user.
    
    Args:
        user: User registration data
        db: Database session
        
    Returns:
        User: The created user
        
    Raises:
        HTTPException: If the user already exists
    """
    auth_service = AuthService(db)
    db_user = await auth_service.get_user_by_email(email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    return await auth_service.create_user(user=user)

@router.get("/me", response_model=UserInDB)
async def read_users_me(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current user information.
    
    Args:
        current_user: The authenticated user
        
    Returns:
        User: The current user
    """
    return current_user

@router.put("/me", response_model=UserInDB)
async def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(user_repo.get_db),
) -> User:
    """Update current user information.
    
    Args:
        user_update: User update data
        current_user: The authenticated user
        db: Database session
        
    Returns:
        User: The updated user
    """
    auth_service = AuthService(db)
    return await auth_service.update_user(
        user=current_user,
        user_update=user_update,
    )
