"""
Authentication endpoints for the Vocaria API.

This module handles user authentication, including login, registration,
password reset, and token management.
"""
from datetime import timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from vocaria.api.v1.dependencies import get_db
from vocaria.core.security import (
    get_password_hash,
    create_access_token,
    get_current_user,
    generate_password_reset_token,
    verify_password_reset_token,
    generate_email_verification_token,
)
from vocaria.core.config import settings
from vocaria.db.models import User
from vocaria.schemas.token import Token, TokenPayload
from vocaria.schemas.user import UserCreate, UserInDB, UserResponse
from vocaria.schemas.msg import Msg
from vocaria.services.user_service import user_service

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """OAuth2 compatible token login, get an access token for future requests.
    
    Args:
        db: Database session
        form_data: OAuth2 form data with username (email) and password
        
    Returns:
        Token: Access token and token type
        
    Raises:
        HTTPException: If login credentials are invalid
    """
    user = await user_service.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "user": UserResponse.from_orm(user),
    }

@router.post("/register", response_model=UserResponse)
async def register(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """Register a new user.
    
    Args:
        db: Database session
        user_in: User registration data
        
    Returns:
        UserResponse: The created user
        
    Raises:
        HTTPException: If user with email already exists
    """
    user = await user_service.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    
    user = await user_service.create(db, obj_in=user_in)
    # TODO: Send email verification
    return user

@router.post("/password-recovery/{email}", response_model=Msg)
async def recover_password(email: str, db: AsyncSession = Depends(get_db)) -> Any:
    """Password recovery.
    
    Args:
        email: Email address to recover password for
        db: Database session
        
    Returns:
        Msg: Success message
    """
    user = await user_service.get_by_email(db, email=email)
    
    if not user:
        # Don't reveal that the user doesn't exist
        return {"msg": "If this email is registered, you will receive a password reset link."}
    
    password_reset_token = generate_password_reset_token(email=email)
    # TODO: Send email with password reset link
    return {"msg": "Password recovery email sent"}

@router.post("/reset-password/", response_model=Msg)
async def reset_password(
    token: str = Body(...),
    new_password: str = Body(..., min_length=8),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Reset password.
    
    Args:
        token: Password reset token
        new_password: New password
        db: Database session
        
    Returns:
        Msg: Success message
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    email = verify_password_reset_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token"
        )
    
    user = await user_service.get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The user with this email does not exist in the system.",
        )
    
    await user_service.update_password(
        db, db_obj=user, new_password=new_password
    )
    return {"msg": "Password updated successfully"}

@router.get("/me", response_model=UserResponse)
async def read_user_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get current user.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        UserResponse: Current user data
    """
    return current_user

@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_user),
) -> Any:
    """Refresh access token.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Token: New access token and token type
    """
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            current_user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }
