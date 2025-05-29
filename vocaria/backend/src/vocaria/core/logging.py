"""
Logging configuration for the Vocaria application.

This module sets up logging with the appropriate format and handlers.
"""
import logging
import logging.config
import sys
from pathlib import Path
from typing import Dict, Any

from vocaria.config import settings

def setup_logging() -> None:
    """Configure logging for the application.
    
    Sets up logging with the specified log level and format from settings.
    """
    log_level = settings.LOG_LEVEL.upper()
    log_format = settings.LOG_FORMAT
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Configure specific loggers
    loggers = {
        "uvicorn": logging.INFO,
        "uvicorn.error": logging.INFO,
        "uvicorn.access": logging.INFO,
        "sqlalchemy.engine": logging.INFO if settings.DEBUG else logging.WARNING,
        "aioredis": logging.INFO,
        "httpx": logging.WARNING,
        "httpcore": logging.WARNING,
    }
    
    for logger_name, level in loggers.items():
        logging.getLogger(logger_name).setLevel(level)
    
    # Disable debug logging for all loggers from external libraries
    if not settings.DEBUG:
        for name in logging.root.manager.loggerDict:
            if name.startswith(('asyncio', 'aiohttp', 'aiosqlite', 'aioredis')):
                logging.getLogger(name).setLevel(logging.WARNING)
