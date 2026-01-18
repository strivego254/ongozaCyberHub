"""
Development settings for core project.
"""
from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'testserver']

# Frontend URL for development
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Session settings for OAuth (cross-origin)
SESSION_COOKIE_SAMESITE = 'Lax'  # Allow cross-origin session cookies in development
SESSION_COOKIE_SECURE = False  # Not secure in development (no HTTPS)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_DOMAIN = None  # Allow localhost/127.0.0.1
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False
CSRF_TRUSTED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']

# Development-specific settings
INSTALLED_APPS = INSTALLED_APPS + [
    'django_extensions',  # Optional: for enhanced shell, etc.
]

# Logging configuration for development
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}


