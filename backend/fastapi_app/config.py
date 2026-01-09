"""
Configuration settings for FastAPI application.
"""
from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file (same as Django does)
# Priority: 1) Project root, 2) backend/fastapi_app (legacy), 3) backend (legacy)
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/fastapi_app
PROJECT_ROOT = BASE_DIR.parent.parent  # /home/caleb/kiptoo/striveGo/och/ongozaCyberHub

# Try loading from project root first (primary location - matches Django)
root_env = PROJECT_ROOT / '.env'
if root_env.exists():
    load_dotenv(root_env, override=True)
    print(f"✅ Loaded .env from project root: {root_env}")
else:
    # Fallback to legacy locations for backward compatibility
    env_path = BASE_DIR / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        print(f"⚠️ Loaded .env from legacy location: {env_path}")
    else:
        parent_env = BASE_DIR.parent / '.env'
        if parent_env.exists():
            load_dotenv(parent_env)
            print(f"⚠️ Loaded .env from legacy location: {parent_env}")


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    # Application
    APP_NAME: str = "Ongoza CyberHub AI API"
    DEBUG: bool = False
    
    # Database - Vector Store (PGVector)
    VECTOR_DB_HOST: str = "localhost"
    VECTOR_DB_PORT: int = 5433
    VECTOR_DB_NAME: str = "ongozacyberhub_vector"
    VECTOR_DB_USER: str = "postgres"
    VECTOR_DB_PASSWORD: str = "postgres"
    
    # Alternative: Pinecone
    USE_PINECONE: bool = False
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = ""
    PINECONE_INDEX_NAME: str = "ongozacyberhub"
    
    # Django API Communication
    DJANGO_API_URL: str = "http://localhost:8000"
    DJANGO_API_TIMEOUT: int = 30
    
    # Embedding Model
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # JWT (shared with Django)
    # rest_framework_simplejwt uses Django's SECRET_KEY for signing tokens
    # We must use the same key - get it from DJANGO_SECRET_KEY env var
    DJANGO_SECRET_KEY: str = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-change-me-in-production')
    JWT_SECRET_KEY: str = ""  # Will be set to DJANGO_SECRET_KEY if not provided
    JWT_ALGORITHM: str = "HS256"
    
    class Config:
        # Pydantic will use this path as fallback, but we've already loaded via load_dotenv above
        # Point to root .env if it exists, otherwise use default
        env_file = str(root_env) if 'root_env' in globals() and root_env.exists() else ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        # Allow reading from environment variables (Pydantic will override with env vars)
        extra = "ignore"


settings = Settings()

# If JWT_SECRET_KEY is not explicitly set, use DJANGO_SECRET_KEY
# This is critical: Django's rest_framework_simplejwt signs tokens with SECRET_KEY
if not settings.JWT_SECRET_KEY or settings.JWT_SECRET_KEY == "":
    settings.JWT_SECRET_KEY = settings.DJANGO_SECRET_KEY


