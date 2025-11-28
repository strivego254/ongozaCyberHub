# System Architecture

## Overview

Ongoza CyberHub is a hybrid microservices platform built with Django, FastAPI, and Next.js. The system is designed to handle both traditional CRUD operations and AI-powered features like recommendations and personality analysis.

## Architecture Diagram

```
┌─────────────────┐
│   Next.js       │
│   Frontend      │
│   (Port 3000)   │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│   Django API    │  │   FastAPI AI     │
│   (Port 8000)   │  │   (Port 8001)    │
└────────┬────────┘  └────────┬─────────┘
         │                     │
         │                     │
         ▼                     ▼
┌─────────────────┐  ┌─────────────────┐
│  PostgreSQL     │  │  PostgreSQL     │
│  Relational DB  │  │  Vector DB      │
│  (Port 5432)    │  │  (Port 5433)    │
└─────────────────┘  └─────────────────┘
```

## Service Responsibilities

### Django API (Port 8000)

**Responsibilities:**
- User authentication and authorization (JWT)
- User management
- Organization management
- Progress tracking
- Business logic and data validation
- Relational data storage

**Technology Stack:**
- Django 5+
- Django REST Framework
- PostgreSQL (relational)
- JWT authentication

**Key Endpoints:**
- `/api/v1/users/` - User management
- `/api/v1/organizations/` - Organization management
- `/api/v1/progress/` - Progress tracking
- `/api/v1/health/` - Health check

### FastAPI AI Service (Port 8001)

**Responsibilities:**
- AI-powered recommendations
- Embedding generation and storage
- Personality analysis
- Vector similarity search
- Content recommendations

**Technology Stack:**
- FastAPI
- PostgreSQL with pgvector extension
- Sentence Transformers (embeddings)
- Async/await for performance

**Key Endpoints:**
- `/api/v1/recommendations` - Get personalized recommendations
- `/api/v1/embeddings` - Generate embeddings
- `/api/v1/personality/analyze` - Analyze user personality

### Next.js Frontend (Port 3000)

**Responsibilities:**
- User interface and dashboards
- API integration with both backends
- Client-side routing
- State management
- UI/UX

**Technology Stack:**
- Next.js 14+ (App Router)
- TypeScript
- TailwindCSS
- React Query (for data fetching)

## Data Flow

### User Registration Flow
1. Frontend → Django API: POST `/api/v1/users/`
2. Django creates user and returns JWT token
3. Frontend stores token for subsequent requests

### Recommendation Flow
1. Frontend → FastAPI: POST `/api/v1/recommendations` (with user_id)
2. FastAPI → Django API: GET `/api/v1/progress/?user={user_id}`
3. FastAPI generates embeddings and performs similarity search
4. FastAPI returns recommendations to Frontend

### Progress Update Flow
1. Frontend → Django API: POST/PATCH `/api/v1/progress/`
2. Django updates relational database
3. Optionally: Django → FastAPI: Trigger embedding update

## Communication Patterns

### Django ↔ FastAPI

**Authentication:**
- Shared JWT secret key
- FastAPI validates tokens issued by Django

**HTTP Communication:**
- FastAPI uses `httpx` to call Django endpoints
- Django can call FastAPI endpoints using `requests` or `httpx`
- All internal communication uses HTTP/JSON

**Error Handling:**
- Standard HTTP status codes
- JSON error responses with `detail` field

## Database Architecture

### Relational Database (PostgreSQL)
- Stores structured data: users, organizations, progress
- ACID compliance for transactional operations
- Foreign key relationships
- Managed by Django ORM

### Vector Database (PostgreSQL + pgvector)
- Stores embeddings for similarity search
- Enables fast vector operations
- Managed by FastAPI with asyncpg
- Separate database instance for isolation

## Security

- JWT authentication across all services
- CORS configuration for frontend
- Environment-based secrets
- Input validation on all endpoints
- SQL injection prevention (ORM/parameterized queries)

## Deployment

- Docker Compose for local development
- Separate containers for each service
- Health checks for all services
- Volume mounts for development
- Environment variable configuration

## Scalability Considerations

- FastAPI async architecture for high concurrency
- Database connection pooling
- Caching layer (to be implemented)
- Load balancing (production)
- Horizontal scaling capability


