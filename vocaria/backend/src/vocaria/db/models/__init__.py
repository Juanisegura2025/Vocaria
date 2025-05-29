"""
Database models for the Vocaria application.

This module imports all database models to ensure they are registered with SQLAlchemy.
"""
from vocaria.db.models.user import User
from vocaria.db.models.tour import Tour
from vocaria.db.models.lead import Lead
from vocaria.db.models.usage import Usage
from vocaria.db.models.conversation import Conversation

# This ensures that all models are imported and registered with SQLAlchemy
__all__ = [
    'User',
    'Tour',
    'Lead',
    'Usage',
    'Conversation',
]
