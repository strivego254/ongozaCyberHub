# Backend Structure

## Django Application Structure

```
backend/django_app/
├── manage.py                 # Django management script
├── core/                     # Django project core
│   ├── settings/            # Settings modules
│   │   ├── base.py         # Base settings
│   │   ├── development.py # Development settings
│   │   └── production.py  # Production settings
│   ├── urls.py             # Root URL configuration
│   └── wsgi.py             # WSGI application
├── api/                     # API versioning and routing
│   ├── urls.py             # API v1 URL routing
│   └── views.py            # API views
├── users/                   # User management app
│   ├── models.py           # User model
│   ├── serializers.py      # User serializers
│   ├── views.py            # User viewsets
│   ├── urls.py             # User URLs
│   └── admin.py            # Admin interface
├── organizations/           # Organization management app
│   ├── models.py           # Organization models
│   ├── serializers.py      # Organization serializers
│   ├── views.py            # Organization viewsets
│   ├── urls.py             # Organization URLs
│   └── admin.py            # Admin interface
├── progress/                # Progress tracking app
│   ├── models.py           # Progress model
│   ├── serializers.py      # Progress serializers
│   ├── views.py            # Progress viewsets
│   ├── urls.py             # Progress URLs
│   └── admin.py            # Admin interface
├── shared_schemas/          # Shared schema definitions
│   ├── user_schemas.py     # User schema definitions
│   ├── organization_schemas.py
│   └── progress_schemas.py
└── requirements.txt         # Python dependencies
```

## FastAPI Application Structure

```
backend/fastapi_app/
├── main.py                  # FastAPI application entry point
├── config.py               # Configuration settings
├── routers/                 # API routers
│   └── v1/                 # Version 1 routers
│       ├── recommendations.py
│       ├── embeddings.py
│       └── personality.py
├── schemas/                 # Pydantic schemas
│   ├── base.py            # Base schemas
│   ├── user.py            # User schemas
│   ├── organization.py    # Organization schemas
│   ├── progress.py        # Progress schemas
│   ├── recommendation.py  # Recommendation schemas
│   ├── embedding.py       # Embedding schemas
│   └── personality.py    # Personality schemas
├── models/                  # Pydantic models (references)
│   ├── user.py
│   ├── organization.py
│   └── progress.py
├── services/                # Business logic services
│   ├── embedding_service.py
│   ├── recommendation_service.py
│   └── personality_service.py
├── vector_store/            # Vector database clients
│   ├── pgvector_client.py  # PGVector client
│   └── pinecone_client.py  # Pinecone client (placeholder)
├── utils/                   # Utility modules
│   ├── auth.py             # Authentication utilities
│   └── http_client.py      # HTTP client for Django API
└── requirements.txt         # Python dependencies
```

## Key Components

### Django Apps

#### Users App
- **Model**: Custom User model extending AbstractUser
- **Features**: Email-based authentication, user profiles
- **Endpoints**: `/api/v1/users/`

#### Organizations App
- **Model**: Organization and OrganizationMember models
- **Features**: Multi-tenant organization support, role-based access
- **Endpoints**: `/api/v1/organizations/`

#### Progress App
- **Model**: Progress tracking model
- **Features**: Track user progress on content, completion status
- **Endpoints**: `/api/v1/progress/`

### FastAPI Services

#### Embedding Service
- Generates embeddings using sentence transformers
- Stores embeddings in vector database
- Handles similarity search

#### Recommendation Service
- Fetches user progress from Django
- Generates personalized recommendations
- Uses vector similarity for content matching

#### Personality Service
- Analyzes user behavior patterns
- Generates personality traits
- Provides learning recommendations

## API Versioning

Both Django and FastAPI use URL-based versioning:
- Django: `/api/v1/...`
- FastAPI: `/api/v1/...`

Future versions will use `/api/v2/`, etc.

## Schema Synchronization

Schemas are maintained in two places:
1. **Django**: `shared_schemas/` app with DRF serializers
2. **FastAPI**: `schemas/` directory with Pydantic models

Both must be kept in sync manually (automated sync tooling to be implemented).

## Database Migrations

### Django
```bash
python manage.py makemigrations
python manage.py migrate
```

### FastAPI
- Uses raw SQL for schema initialization
- Managed through `vector_store` clients
- Schema initialization scripts in Docker entrypoint

## Development Workflow

1. **Django Development**:
   - Create models in respective apps
   - Create serializers
   - Create viewsets
   - Register URLs
   - Run migrations

2. **FastAPI Development**:
   - Define Pydantic schemas
   - Create router endpoints
   - Implement service logic
   - Update vector store operations

3. **Schema Updates**:
   - Update shared schema documentation
   - Update Django serializers
   - Update FastAPI Pydantic models
   - Regenerate OpenAPI specs


