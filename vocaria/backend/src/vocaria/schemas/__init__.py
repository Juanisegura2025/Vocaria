"""
Pydantic schemas for request/response validation and serialization.

This package contains all the Pydantic models used for request/response validation
and serialization in the Vocaria API.
"""
from .base import (
    BaseModel,
    IDModelMixin,
    DateTimeModelMixin,
    PaginatedResponse,
    ErrorResponse,
    SuccessResponse,
    EmptyResponse,
    ListResponse,
)
from .token import Token, TokenPayload, TokenData, TokenCreate, TokenRefresh
from .msg import (
    Msg,
    SuccessMsg,
    ErrorMsg,
    ValidationErrorMsg,
    NotFoundMsg,
    UnauthorizedMsg,
    ForbiddenMsg,
    RateLimitMsg,
)
from .user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserInDB,
    UserResponse,
    UserRegister,
    UserLogin,
    UserPasswordReset,
    UserPasswordResetConfirm,
    UserProfileUpdate,
)
from .tour import (
    TourBase,
    TourCreate,
    TourUpdate,
    TourInDB,
    TourResponse,
    TourWithLeads,
    TourListResponse,
    TourWidgetConfig,
    TourCreateWithConfig,
    TourUpdateWithConfig,
)
from .lead import (
    LeadStatus,
    LeadBase,
    LeadCreate,
    LeadUpdate,
    LeadInDB,
    LeadResponse,
    LeadWithTour,
    LeadListResponse,
    LeadFilter,
    LeadNoteCreate,
    LeadNoteResponse,
)
from .usage import (
    UsageBase,
    UsageCreate,
    UsageUpdate,
    UsageInDB,
    UsageResponse,
    UsageSummary,
    UsageByDate,
    UsageByTour,
    UsageReport,
    UsageLimit,
    UsageAlert,
)
from .conversation import (
    MessageRole,
    MessageType,
    MessageStatus,
    MessageContent,
    Message,
    ConversationBase,
    ConversationCreate,
    ConversationUpdate,
    ConversationInDB,
    ConversationResponse,
    ConversationWithMessages,
    ConversationListResponse,
    ConversationFilter,
    NewMessage,
    MessageResponse,
    MessageListResponse,
    TypingIndicator,
)

# Re-export all schemas for easier imports
__all__ = [
    # Base
    'BaseModel',
    'IDModelMixin',
    'DateTimeModelMixin',
    'PaginatedResponse',
    'ErrorResponse',
    'SuccessResponse',
    'EmptyResponse',
    'ListResponse',
    
    # Token
    'Token',
    'TokenPayload',
    'TokenData',
    'TokenCreate',
    'TokenRefresh',
    
    # Common
    'Msg',
    'SuccessMsg',
    'ErrorMsg',
    'ValidationErrorMsg',
    'NotFoundMsg',
    'UnauthorizedMsg',
    'ForbiddenMsg',
    'RateLimitMsg',
    
    # User
    'UserBase',
    'UserCreate',
    'UserUpdate',
    'UserInDB',
    'UserResponse',
    'UserRegister',
    'UserLogin',
    'UserPasswordReset',
    'UserPasswordResetConfirm',
    'UserProfileUpdate',
    
    # Tour
    'TourBase',
    'TourCreate',
    'TourUpdate',
    'TourInDB',
    'TourResponse',
    'TourWithLeads',
    'TourListResponse',
    'TourWidgetConfig',
    'TourCreateWithConfig',
    'TourUpdateWithConfig',
    
    # Lead
    'LeadStatus',
    'LeadBase',
    'LeadCreate',
    'LeadUpdate',
    'LeadInDB',
    'LeadResponse',
    'LeadWithTour',
    'LeadListResponse',
    'LeadFilter',
    'LeadNoteCreate',
    'LeadNoteResponse',
    
    # Usage
    'UsageBase',
    'UsageCreate',
    'UsageUpdate',
    'UsageInDB',
    'UsageResponse',
    'UsageSummary',
    'UsageByDate',
    'UsageByTour',
    'UsageReport',
    'UsageLimit',
    'UsageAlert',
    
    # Conversation
    'MessageRole',
    'MessageType',
    'MessageStatus',
    'MessageContent',
    'Message',
    'ConversationBase',
    'ConversationCreate',
    'ConversationUpdate',
    'ConversationInDB',
    'ConversationResponse',
    'ConversationWithMessages',
    'ConversationListResponse',
    'ConversationFilter',
    'NewMessage',
    'MessageResponse',
    'MessageListResponse',
    'TypingIndicator',
]
