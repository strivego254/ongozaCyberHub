# Backend Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Django Backend](#django-backend)
4. [FastAPI Backend](#fastapi-backend)
5. [Shared Database Architecture](#shared-database-architecture)
6. [Service Integration](#service-integration)
7. [Authentication & Authorization](#authentication--authorization)
8. [Frontend Integration](#frontend-integration)
9. [Deployment Architecture](#deployment-architecture)
10. [Data Flow Diagrams](#data-flow-diagrams)

---
### docs1 path

```
cd ~/kiptoo/striveGo/och/ongozaCyberHub/docs1/...
```

## Overview

The Ongoza CyberHub platform employs a **triangular microservices architecture** consisting of:

- **Django REST Framework**: Core business logic, user management, and CRUD operations
- **FastAPI**: AI services, vector processing, recommendations, and ML-powered features
- **Next.js Frontend**: Single-page application consuming both backend services
- **Shared Database Architecture**: Both services access PostgreSQL databases (relational and vector)

This architecture provides:
- **Separation of Concerns**: Business logic separated from AI/ML services
- **Scalability**: Independent scaling of Django and FastAPI services
- **Performance**: FastAPI's async capabilities for AI workloads
- **Unified Authentication**: Shared JWT secret key for seamless auth across services

---

## Architecture Pattern

### Triangular Architecture

```
                    ┌─────────────┐
                    │  Next.js    │
                    │  Frontend   │
                    └──────┬──────┘
                           │
                           │ HTTP/HTTPS
                           │
            ┌──────────────┴──────────────┐
            │                             │
            │                             │
    ┌───────▼──────┐              ┌───────▼──────┐
    │   Django     │              │   FastAPI    │
    │   (Port 8000)│              │  (Port 8001) │
    │              │              │              │
    │ Core Business│◄─────────────┤  AI Services │
    │    Logic     │   HTTP API   │              │
    └───────┬──────┘              └───────┬──────┘
            │                             │
            │                             │
            └──────────────┬──────────────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │  Databases   │
                    │              │
                    │ • Relational │
                    │ • Vector DB  │
                    └──────────────┘
```

### Key Characteristics

1. **Frontend → Django**: Primary API calls for CRUD operations, authentication, user management
2. **Frontend → FastAPI**: AI-powered features, recommendations, embeddings, personality analysis
3. **FastAPI → Django**: Internal API calls to fetch business data for AI processing
4. **Both → Database**: Direct database access (Django to relational DB, FastAPI to vector DB + Django API)

---

## Django Backend

### Purpose
Django handles all core business logic and data management operations.

### Responsibilities

- **User Management**: Authentication, authorization, user profiles, sessions
- **Business Logic**: Programs, tracks, cohorts, missions, mentorship
- **Data Management**: CRUD operations for all domain entities
- **API Gateway**: Primary REST API endpoint for frontend
- **Admin Interface**: Django admin for content management
- **Background Tasks**: Celery integration for async processing

### Technology Stack

- **Framework**: Django 5.0+ with Django REST Framework
- **Authentication**: `djangorestframework-simplejwt` (JWT tokens)
- **Database**: PostgreSQL (relational data)
- **API Documentation**: `drf-spectacular` (OpenAPI/Swagger)
- **Task Queue**: Celery with Redis broker
- **CORS**: `django-cors-headers`

### Key Configuration

#### Database Configuration
```python
# backend/django_app/core/settings/base.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'ongozacyberhub'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
```

#### JWT Configuration
```python
# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Secret key shared with FastAPI
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-change-me-in-production')
```

#### REST Framework Configuration
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
```

### Django Apps Structure

```
backend/django_app/
├── users/              # User authentication and management
├── organizations/      # Organization management
├── programs/          # Programs, tracks, cohorts
├── missions/          # Mission management and submissions
├── mentorship/        # Mentorship coordination
├── coaching/          # Coaching, habits, goals, reflections
├── progress/          # Student progress tracking
├── dashboard/         # Dashboard data aggregation
├── director_dashboard/# Director analytics
├── sponsor_dashboard/ # Sponsor management
├── subscriptions/    # Subscription and billing
└── api/              # API routing and views
```

### API Endpoints

Django exposes REST API endpoints under `/api/v1/`:

- `/api/v1/auth/*` - Authentication endpoints
- `/api/v1/users/*` - User management
- `/api/v1/programs/*` - Program management
- `/api/v1/missions/*` - Mission operations
- `/api/v1/student/*` - Student-specific endpoints
- `/api/v1/director/*` - Director dashboard endpoints
- `/api/v1/sponsor/*` - Sponsor dashboard endpoints

---

## FastAPI Backend

### Purpose
FastAPI handles AI-powered services, vector processing, and ML features.

### Responsibilities

- **AI Services**: Recommendations, embeddings, personality analysis
- **Vector Processing**: PGVector operations for semantic search
- **ML Integration**: Embedding models, recommendation engines
- **Async Processing**: High-performance async operations
- **API Gateway**: Secondary API endpoint for AI features

### Technology Stack

- **Framework**: FastAPI with async/await support
- **Authentication**: JWT verification using shared secret
- **Vector Database**: PostgreSQL with pgvector extension
- **HTTP Client**: `httpx` for Django API communication
- **ML Models**: Sentence transformers for embeddings
- **CORS**: FastAPI CORS middleware

### Key Configuration

#### Application Setup
```python
# backend/fastapi_app/main.py
app = FastAPI(
    title="Ongoza CyberHub AI API",
    description="AI, vector processing, and recommendation engine API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Vector Database Configuration
```python
# backend/fastapi_app/config.py
class Settings(BaseSettings):
    # Vector Database (PGVector)
    VECTOR_DB_HOST: str = "localhost"
    VECTOR_DB_PORT: int = 5433
    VECTOR_DB_NAME: str = "ongozacyberhub_vector"
    VECTOR_DB_USER: str = "postgres"
    VECTOR_DB_PASSWORD: str = "postgres"
    
    # Django API Communication
    DJANGO_API_URL: str = "http://localhost:8000"
    DJANGO_API_TIMEOUT: int = 30
    
    # JWT (shared with Django)
    JWT_SECRET_KEY: str = "django-insecure-change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
```

### FastAPI Routers

```
backend/fastapi_app/
├── routers/
│   └── v1/
│       ├── profiling.py        # AI career profiling system
│       ├── recommendations.py  # Content recommendations
│       ├── embeddings.py      # Text embeddings
│       ├── personality.py     # Personality analysis
│       ├── missions.py        # AI-powered mission features
│       ├── curriculum.py      # Curriculum recommendations
│       ├── coaching.py        # AI coaching features
│       └── dashboard.py       # AI dashboard insights
├── services/
│   ├── profiling_service.py     # AI profiling and track matching
│   ├── embedding_service.py
│   ├── personality_service.py
│   └── recommendation_service.py
├── vector_store/
│   ├── pgvector_client.py
│   └── pinecone_client.py
└── utils/
    ├── auth.py          # JWT verification
    └── http_client.py   # Django API client
```

### API Endpoints

FastAPI exposes endpoints under `/api/v1/`:

- `/api/v1/profiling/*` - AI career profiling system
- `/api/v1/recommendations/*` - Content recommendations
- `/api/v1/embeddings/*` - Text embedding generation
- `/api/v1/personality/*` - Personality analysis
- `/api/v1/student/coaching/*` - AI coaching features
- `/api/v1/student/dashboard/*` - AI dashboard insights

### AI Profiling System

FastAPI includes a sophisticated AI profiling system that assesses users across 5 OCH tracks using weighted scoring algorithms.

#### OCH Tracks

1. **Builders** - Technical construction and engineering
   - Focus: Software architecture, system design, code quality
   - Careers: Software Engineer, DevOps Engineer, Technical Lead

2. **Leaders** - Management and executive decision-making
   - Focus: Team management, strategic planning, stakeholder relations
   - Careers: Engineering Manager, Product Manager, CTO

3. **Entrepreneurs** - Business value creation
   - Focus: Product development, market analysis, revenue models
   - Careers: Startup Founder, Product Entrepreneur, Business Development

4. **Researchers** - Deep technical investigation
   - Focus: Research & development, innovation, emerging technologies
   - Careers: Research Scientist, Data Scientist, Principal Researcher

5. **Educators** - Knowledge transfer and training
   - Focus: Technical training, mentorship, content creation
   - Careers: Technical Trainer, Engineering Mentor, Learning Lead

#### Assessment Categories

The profiling system evaluates users across four weighted categories:

1. **Technical Aptitude** (Weight: 1.2)
   - Logic and pattern recognition
   - Technical problem-solving approaches

2. **Problem-Solving Style** (Weight: 1.1)
   - Decision-making approaches
   - Complex challenge handling

3. **Scenario Preferences** (Weight: 1.0)
   - Choose-your-path situational questions
   - Real-world work scenario preferences

4. **Work Style** (Weight: 0.9)
   - Stability vs Exploration balance
   - Detail orientation and energy preferences

#### Profiling Algorithm

- **Question Count**: 12+ scenario-based questions
- **Scoring Method**: Weighted multi-dimensional assessment
- **Confidence Levels**: High (primary recommendation), Medium, Low
- **Result Format**: Primary track + secondary options with detailed reasoning

#### API Endpoints

```
POST /api/v1/profiling/session/start          # Start profiling session
GET  /api/v1/profiling/session/{id}/progress  # Get session progress
GET  /api/v1/profiling/questions              # Get all questions
POST /api/v1/profiling/session/{id}/respond   # Submit answer
POST /api/v1/profiling/session/{id}/complete  # Complete assessment
GET  /api/v1/profiling/session/{id}/results   # Get results
GET  /api/v1/profiling/tracks                 # Get track information
DELETE /api/v1/profiling/session/{id}         # Delete session
```

---

## Shared Database Architecture

### Database Strategy

The platform uses a **dual-database shared architecture**:

1. **PostgreSQL Relational Database** (`ongozacyberhub`)
   - Managed by Django
   - Stores all business data (users, programs, missions, etc.)
   - Accessed directly by Django ORM
   - Accessed by FastAPI via Django REST API (not direct DB access)

2. **PostgreSQL Vector Database** (`ongozacyberhub_vector`)
   - Managed by FastAPI
   - Stores embeddings and vector data
   - Uses pgvector extension for similarity search
   - Accessed directly by FastAPI via asyncpg

### Why This Architecture?

**Shared Database Pattern Benefits:**
- **Data Consistency**: Single source of truth for business data
- **Transaction Integrity**: Django handles all data mutations
- **Separation of Concerns**: Vector data isolated from relational data
- **Performance**: Optimized databases for their specific use cases

**FastAPI → Django API Communication:**
- FastAPI does **NOT** directly access Django's database
- Instead, FastAPI makes HTTP API calls to Django endpoints
- This maintains service boundaries and allows for:
  - Independent scaling
  - Service isolation
  - API versioning
  - Better error handling

### Database Connection Flow

```
┌─────────────┐                    ┌─────────────┐
│   Django    │                    │   FastAPI   │
│             │                    │             │
│  Direct DB  │                    │  Direct DB  │
│  Access     │                    │  Access     │
│  (ORM)      │                    │  (asyncpg)  │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │                                  │
       ▼                                  ▼
┌──────────────┐                  ┌──────────────┐
│  PostgreSQL  │                  │  PostgreSQL  │
│  Relational  │                  │   Vector     │
│   Database   │                  │   Database   │
│              │                  │              │
│ ongozacyberhub│                  │ ongozacyberhub│
│              │                  │   _vector    │
└──────────────┘                  └──────────────┘
```

### FastAPI → Django Data Access Pattern

When FastAPI needs business data, it uses the `DjangoAPIClient`:

```python
# backend/fastapi_app/utils/http_client.py
class DjangoAPIClient:
    """Client for making requests to Django API."""
    
    async def get(self, endpoint: str, headers: Optional[Dict[str, str]] = None):
        url = f"{self.base_url}{endpoint}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
```

**Example Usage:**
```python
# FastAPI router fetching coaching data from Django
@router.get("/overview")
async def get_coaching_overview(user_id: UUID = Depends(get_current_user_id)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.DJANGO_API_URL}/api/v1/student/coaching/overview",
            headers={"X-User-ID": str(user_id)}
        )
        return response.json()
```

---

## Service Integration

### How Django and FastAPI Work Together

#### 1. **Authentication Flow**

```
User Login → Django → JWT Token → Frontend
                                    ↓
                            FastAPI (validates same JWT)
```

Both services use the **same JWT secret key**, allowing seamless authentication.

#### 2. **Data Flow for AI Features**

```
Frontend Request → FastAPI
                      ↓
              Verify JWT Token
                      ↓
              Extract user_id
                      ↓
              Call Django API (with user context)
                      ↓
              Process AI/ML operations
                      ↓
              Return enriched data to Frontend
```

#### AI Profiling User Flow

```
User Signup → Django API (/api/v1/auth/signup)
      ↓ (success response with redirect_url)
Frontend Redirect → /onboarding/ai-profiler
      ↓
POST /api/v1/profiling/session/start
      ↓
GET /api/v1/profiling/questions
      ↓
Question-by-Question Assessment
POST /api/v1/profiling/session/{id}/respond
      ↓
Complete Assessment
POST /api/v1/profiling/session/{id}/complete
      ↓
Results Display → Primary + Secondary Tracks
      ↓
Redirect to Dashboard with Track Context
GET /dashboard/student?track={track_key}&welcome=true
```

#### 3. **Example: AI Coaching Feature**

```python
# FastAPI endpoint
@router.get("/ai-coach")
async def get_ai_coach_plan(user_id: UUID = Depends(get_current_user_id)):
    # 1. Fetch user data from Django
    async with httpx.AsyncClient() as client:
        coaching_data = await client.get(
            f"{settings.DJANGO_API_URL}/api/v1/student/coaching/overview",
            headers={"X-User-ID": str(user_id)}
        )
    
    # 2. Process with AI models
    ai_insights = process_with_ai(coaching_data)
    
    # 3. Return enriched response
    return ai_insights
```

#### 4. **Service Communication Patterns**

**Pattern 1: FastAPI Aggregates Django Data**
- FastAPI endpoint receives request
- Calls multiple Django endpoints
- Aggregates and processes data
- Returns enriched response

**Pattern 2: Django Triggers FastAPI Processing**
- Django endpoint receives request
- Stores data in database
- Optionally calls FastAPI for async processing
- Returns immediate response

**Pattern 3: Frontend Orchestrates Both**
- Frontend makes parallel requests to Django and FastAPI
- Combines responses client-side
- Displays unified UI

### Communication Headers

When FastAPI calls Django, it includes:

- **Authorization**: JWT token (if available)
- **X-User-ID**: User ID extracted from JWT
- **Content-Type**: `application/json`

---

## Authentication & Authorization

### Shared JWT Architecture

Both Django and FastAPI use the **same JWT secret key** for token verification, enabling seamless authentication across services.

### JWT Token Structure

Django generates JWT tokens with the following payload:
```json
{
  "user_id": 123,
  "email": "user@example.com",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### Django JWT Generation

```python
# backend/django_app/users/utils/auth_utils.py
from rest_framework_simplejwt.tokens import RefreshToken

def create_user_session(user, ...):
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    return access_token, refresh_token, session
```

**Configuration:**
```python
# backend/django_app/core/settings/base.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
```

### FastAPI JWT Verification

FastAPI verifies tokens using the **same secret key**:

```python
# backend/fastapi_app/utils/auth.py
from jose import JWTError, jwt
from config import settings

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify JWT token (shared secret with Django).
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,  # Same secret as Django
            algorithms=[settings.JWT_ALGORITHM],  # HS256
        )
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
```

**Configuration:**
```python
# backend/fastapi_app/config.py
class Settings(BaseSettings):
    # JWT (shared with Django)
    JWT_SECRET_KEY: str = "django-insecure-change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
```

### Authentication Flow

#### 1. **User Login (Django)**

```
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {...}
}
```

#### 2. **Frontend Stores Tokens**

```typescript
// Frontend stores tokens in localStorage/cookies
localStorage.setItem('access_token', response.access_token);
localStorage.setItem('refresh_token', response.refresh_token);
```

#### 3. **Frontend → Django Request**

```typescript
// Frontend includes token in Authorization header
fetch('/api/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
})
```

#### 4. **Frontend → FastAPI Request**

```typescript
// Same token works for FastAPI
fetch('/api/v1/recommendations', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
})
```

#### 5. **FastAPI Verifies Token**

```python
# FastAPI extracts and verifies token
@router.get("/recommendations")
async def get_recommendations(
    user_id: UUID = Depends(verify_token)  # Uses shared secret
):
    # Token verified, user_id extracted
    return get_recommendations_for_user(user_id)
```

### Token Refresh Flow

When access token expires:

```
1. Frontend detects 401 Unauthorized
2. Frontend calls Django refresh endpoint:
   POST /api/v1/auth/token/refresh
   {
     "refresh_token": "..."
   }
3. Django returns new access_token
4. Frontend retries original request with new token
```

### Security Considerations

1. **Shared Secret Key**: Both services must use identical `JWT_SECRET_KEY`
2. **Environment Variables**: Secret key stored in `.env` files
3. **Token Expiration**: Access tokens expire after 60 minutes
4. **Refresh Tokens**: Long-lived (7 days) for seamless re-authentication
5. **Token Rotation**: Refresh tokens rotated on use
6. **HTTPS**: All production traffic encrypted

### Environment Configuration

**Django (.env):**
```bash
DJANGO_SECRET_KEY=your-secret-key-here
```

**FastAPI (.env):**
```bash
JWT_SECRET_KEY=your-secret-key-here  # Must match Django
JWT_ALGORITHM=HS256
```

**Docker Compose:**
```yaml
services:
  django:
    environment:
      DJANGO_SECRET_KEY: ${JWT_SECRET_KEY}
  
  fastapi:
    environment:
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}  # Same variable
      JWT_ALGORITHM: HS256
```

---

## Frontend Integration

### Next.js API Gateway Pattern

The frontend uses a **unified API gateway** that routes requests to the appropriate backend service.

### API Gateway Implementation

```typescript
// frontend/nextjs_app/services/apiGateway.ts

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
const FASTAPI_API_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL || 'http://localhost:8001';

function getBaseUrl(path: string): string {
  // FastAPI routes (AI, recommendations, embeddings, personality)
  const fastApiPaths = [
    '/recommendations',
    '/embeddings',
    '/personality',
    '/ai/',
  ];

  const isFastApi = fastApiPaths.some(prefix => path.startsWith(prefix));

  if (isFastApi) {
    return `${FASTAPI_API_URL}/api/v1`;
  }

  // Default to Django
  return `${DJANGO_API_URL}/api/v1`;
}
```

### Request Routing Logic

| Frontend Path | Backend Service | Endpoint |
|--------------|----------------|----------|
| `/api/v1/auth/*` | Django | `/api/v1/auth/*` |
| `/api/v1/users/*` | Django | `/api/v1/users/*` |
| `/api/v1/missions/*` | Django | `/api/v1/missions/*` |
| `/api/v1/recommendations/*` | FastAPI | `/api/v1/recommendations/*` |
| `/api/v1/embeddings/*` | FastAPI | `/api/v1/embeddings/*` |
| `/api/v1/personality/*` | FastAPI | `/api/v1/personality/*` |
| `/api/v1/student/coaching/*` | FastAPI | `/api/v1/student/coaching/*` |

### Authentication Handling

The API gateway automatically:
1. **Adds Authorization Header**: Includes JWT token from storage
2. **Handles Token Refresh**: Automatically refreshes expired tokens
3. **Retries Requests**: Retries failed requests after token refresh

```typescript
async function apiGatewayRequest<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const baseUrl = getBaseUrl(path);
  const fullUrl = `${baseUrl}${path}`;

  try {
    return await fetcher<T>(fullUrl, options);
  } catch (error) {
    // If unauthorized and we have a refresh token, try to refresh
    if (isUnauthorizedError(error) && getRefreshToken() && !options.skipAuth) {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        // Retry the original request with new token
        return await fetcher<T>(fullUrl, options);
      }
    }
    throw error;
  }
}
```

### Frontend → Backend Communication Flow

```
┌─────────────┐
│  Next.js    │
│  Frontend   │
└──────┬──────┘
       │
       │ apiGateway.get('/users/me')
       │ Authorization: Bearer <token>
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│   Django    │   │   FastAPI   │
│             │   │             │
│ /api/v1/    │   │ /api/v1/    │
│ users/me    │   │ recommend-  │
│             │   │ ations      │
└─────────────┘   └─────────────┘
```

### Example Frontend Usage

```typescript
// Fetch user data from Django
const user = await apiGateway.get('/users/me');

// Fetch recommendations from FastAPI
const recommendations = await apiGateway.get('/recommendations');

// Create mission in Django
const mission = await apiGateway.post('/missions', {
  title: 'New Mission',
  description: '...'
});

// Get AI coaching insights from FastAPI
const coaching = await apiGateway.get('/student/coaching/ai-coach');
```

---

## Deployment Architecture

### Docker Compose Setup

The platform uses Docker Compose for orchestration:

```yaml
# backend/docker-compose.yml
services:
  # PostgreSQL Relational Database (for Django)
  postgres-relational:
    container_name: ongozacyberhub_postgres
    environment:
      POSTGRES_DB: ongozacyberhub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5434:5432"

  # PostgreSQL Vector Database (for FastAPI)
  postgres-vector:
    container_name: ongozacyberhub_vector_db
    environment:
      POSTGRES_DB: ongozacyberhub_vector
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"

  # Django Application
  django:
    container_name: ongozacyberhub_django
    environment:
      DJANGO_SECRET_KEY: ${DJANGO_SECRET_KEY}
      DB_HOST: postgres-relational
      DB_PORT: 5432
      FASTAPI_BASE_URL: http://fastapi:8001
    ports:
      - "8000:8000"
    depends_on:
      postgres-relational:
        condition: service_healthy

  # FastAPI Application
  fastapi:
    container_name: ongozacyberhub_fastapi
    environment:
      VECTOR_DB_HOST: postgres-vector
      DJANGO_API_URL: http://django:8000
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}  # Same as Django
    ports:
      - "8001:8001"
    depends_on:
      postgres-vector:
        condition: service_healthy
      django:
        condition: service_healthy
```

### Nginx Reverse Proxy

Nginx routes traffic to appropriate services:

```nginx
# docker/nginx/nginx.conf

# Django API routes (/api/*)
location /api/ {
    proxy_pass http://django_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Authorization $http_authorization;
}

# FastAPI AI routes (/ai/*)
location /ai/ {
    proxy_pass http://fastapi_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Authorization $http_authorization;
}

# Next.js frontend (all other routes)
location / {
    proxy_pass http://nextjs_frontend;
}
```

### Service Health Checks

**Django Health Check:**
```bash
curl http://localhost:8000/api/v1/health/
```

**FastAPI Health Check:**
```bash
curl http://localhost:8001/health
```

### Port Mapping

| Service | Internal Port | External Port | URL |
|---------|--------------|---------------|-----|
| Django | 8000 | 8000 | http://localhost:8000 |
| FastAPI | 8001 | 8001 | http://localhost:8001 |
| PostgreSQL (Relational) | 5432 | 5434 | localhost:5434 |
| PostgreSQL (Vector) | 5432 | 5433 | localhost:5433 |
| Next.js | 3000 | 3000 | http://localhost:3000 |
| Nginx | 80 | 80 | http://localhost |

---

## Data Flow Diagrams

### Complete Request Flow: AI Recommendations

```
1. User Action
   └─> Frontend: User clicks "Get Recommendations"
       │
2. Frontend Request
   └─> apiGateway.get('/recommendations')
       │ Authorization: Bearer <jwt_token>
       │
3. API Gateway Routing
   └─> Detects '/recommendations' → Routes to FastAPI
       │
4. FastAPI Receives Request
   └─> /api/v1/recommendations endpoint
       │
5. JWT Verification
   └─> verify_token() dependency
       │ Uses shared JWT_SECRET_KEY
       │ Extracts user_id from token
       │
6. FastAPI Calls Django
   └─> GET http://django:8000/api/v1/users/{user_id}
       │ Headers: X-User-ID: {user_id}
       │
7. Django Processes Request
   └─> Validates user exists
       │ Fetches user data from database
       │ Returns user profile
       │
8. FastAPI Processes AI Logic
   └─> Receives user data from Django
       │ Generates embeddings
       │ Performs vector similarity search
       │ Generates recommendations
       │
9. Response to Frontend
   └─> Returns recommendations JSON
       │
10. Frontend Updates UI
    └─> Displays recommendations to user
```

### Authentication Flow

```
1. User Login
   └─> POST /api/v1/auth/login
       │ Body: { email, password }
       │
2. Django Validates Credentials
   └─> Checks user credentials
       │ Creates JWT tokens
       │ Returns: { access_token, refresh_token }
       │
3. Frontend Stores Tokens
   └─> localStorage.setItem('access_token', ...)
       │ localStorage.setItem('refresh_token', ...)
       │
4. Subsequent Requests
   └─> Frontend includes: Authorization: Bearer <access_token>
       │
5. Django Request
   └─> Validates JWT using SECRET_KEY
       │ Extracts user_id
       │ Processes request
       │
6. FastAPI Request
   └─> Validates JWT using same SECRET_KEY
       │ Extracts user_id
       │ Processes request
       │
7. Token Expiration
   └─> Frontend receives 401 Unauthorized
       │ Calls: POST /api/v1/auth/token/refresh
       │ Body: { refresh_token }
       │ Django returns new access_token
       │ Frontend retries original request
```

### Database Access Patterns

```
Django Database Access:
┌─────────┐
│ Django  │
└────┬────┘
     │ Django ORM
     │
     ▼
┌─────────────┐
│ PostgreSQL  │
│ Relational  │
│ ongozacyberhub│
└─────────────┘

FastAPI Database Access:
┌─────────┐
│ FastAPI │
└────┬────┘
     │ asyncpg
     │
     ▼
┌─────────────┐
│ PostgreSQL  │
│ Vector      │
│ ongozacyberhub│
│ _vector     │
└─────────────┘

FastAPI → Django Data Access:
┌─────────┐         HTTP API         ┌─────────┐
│ FastAPI │ ───────────────────────> │ Django │
└─────────┘                           └────┬───┘
                                            │ Django ORM
                                            ▼
                                     ┌─────────────┐
                                     │ PostgreSQL  │
                                     │ Relational  │
                                     └─────────────┘
```

---

## Summary

### Key Architectural Decisions

1. **Separation of Concerns**: Django handles business logic, FastAPI handles AI/ML
2. **Shared Authentication**: Single JWT secret key enables seamless auth
3. **API Communication**: FastAPI calls Django via HTTP (not direct DB access)
4. **Dual Databases**: Separate databases optimized for relational vs. vector data
5. **Frontend Gateway**: Unified API gateway routes requests intelligently
6. **Independent Scaling**: Services can scale independently based on load

### Benefits

- **Maintainability**: Clear separation of responsibilities
- **Scalability**: Independent scaling of services
- **Performance**: Optimized databases and async processing
- **Security**: Unified authentication with shared secrets
- **Flexibility**: Easy to add new services or modify existing ones

### Future Considerations

- **Service Mesh**: Consider Istio/Linkerd for advanced service communication
- **API Gateway**: Dedicated gateway (Kong, AWS API Gateway) for production
- **Caching**: Redis cache layer for frequently accessed data
- **Message Queue**: RabbitMQ/Kafka for async service communication
- **Monitoring**: Distributed tracing (Jaeger, Zipkin) for request tracking

---

## Appendix

### Environment Variables

**Django (.env):**
```bash
DJANGO_SECRET_KEY=your-secret-key-here
DB_NAME=ongozacyberhub
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DEBUG=True
```

**FastAPI (.env):**
```bash
JWT_SECRET_KEY=your-secret-key-here  # Must match Django
JWT_ALGORITHM=HS256
VECTOR_DB_HOST=localhost
VECTOR_DB_PORT=5433
VECTOR_DB_NAME=ongozacyberhub_vector
VECTOR_DB_USER=postgres
VECTOR_DB_PASSWORD=postgres
DJANGO_API_URL=http://localhost:8000
DJANGO_API_TIMEOUT=30
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_API_URL=http://localhost:8001
```

### Key Files Reference

- **Django Settings**: `backend/django_app/core/settings/base.py`
- **FastAPI Config**: `backend/fastapi_app/config.py`
- **FastAPI Auth**: `backend/fastapi_app/utils/auth.py`
- **Django API Client**: `backend/fastapi_app/utils/http_client.py`
- **Frontend Gateway**: `frontend/nextjs_app/services/apiGateway.ts`
- **Docker Compose**: `backend/docker-compose.yml`
- **Nginx Config**: `docker/nginx/nginx.conf`

---

*Documentation last updated: 2025-01-XX*
