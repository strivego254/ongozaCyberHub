"""
Configuration settings for FastAPI application.
"""
from pydantic_settings import BaseSettings
from typing import List


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
    JWT_SECRET_KEY: str = "django-insecure-change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


