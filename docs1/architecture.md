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

## Testing Module

### Overview

All API endpoints are tested using pytest with Django REST Framework test client. The testing module ensures comprehensive coverage of authentication, authorization, request validation, error handling, and RBAC permissions.

### Testing Framework

**Technology Stack:**
- pytest >= 7.4.0
- pytest-django >= 4.7.0
- pytest-cov >= 4.1.0
- pytest-mock >= 3.12.0
- factory-boy >= 3.3.0

### Test Structure

```
backend/django_app/tests/
├── __init__.py
├── conftest.py                    # Shared fixtures and configuration
├── test_auth_endpoints.py         # Authentication endpoints
├── test_student_dashboard_endpoints.py
├── test_coaching_endpoints.py     # Coaching OS endpoints
├── test_missions_endpoints.py     # Missions MXP endpoints
├── test_profiler_endpoints.py     # Profiler Engine endpoints
├── test_admin_endpoints.py        # Admin/management endpoints
└── test_health_endpoints.py       # Health check and metrics
```

### Test Coverage

All endpoints are tested for:
- **Authentication**: Valid/invalid credentials, token validation
- **Authorization**: RBAC permissions, role-based access control
- **Request Validation**: Required fields, data types, constraints
- **Error Handling**: 400, 401, 403, 404, 500 status codes
- **Edge Cases**: Empty data, invalid IDs, missing fields
- **Success Cases**: Valid requests return expected responses

### Test Categories

Tests are organized by markers:
- `@pytest.mark.auth` - Authentication endpoint tests
- `@pytest.mark.student` - Student dashboard endpoint tests
- `@pytest.mark.coaching` - Coaching OS endpoint tests
- `@pytest.mark.missions` - Missions MXP endpoint tests
- `@pytest.mark.profiler` - Profiler Engine endpoint tests
- `@pytest.mark.admin` - Admin endpoint tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.slow` - Slow running tests

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_auth_endpoints.py

# Run tests by marker
pytest -m auth
pytest -m student

# Run with coverage report
pytest --cov=. --cov-report=html

# Run verbose output
pytest -v

# Run specific test
pytest tests/test_auth_endpoints.py::TestLoginEndpoint::test_login_success
```

### Test Fixtures

Common fixtures available in `conftest.py`:
- `api_client` - Unauthenticated API client
- `authenticated_client` - API client with test user token
- `admin_client` - API client with admin user token
- `student_client` - API client with student user token
- `mentor_client` - API client with mentor user token
- `test_user` - Standard test user
- `admin_user` - Admin test user
- `student_user` - Student test user
- `mentor_user` - Mentor test user
- `test_organization` - Test organization fixture
- Role fixtures: `student_role`, `mentor_role`, `admin_role`

### Endpoint Test Coverage

#### Authentication Endpoints (`/api/v1/auth/*`)
- ✅ Signup (email/password, passwordless)
- ✅ Login (email/password, magic link)
- ✅ Logout
- ✅ Token refresh
- ✅ Get current user (`/me`)
- ✅ Password reset (request/confirm)
- ✅ MFA enrollment and verification
- ✅ Consent management

#### Student Dashboard Endpoints (`/api/v1/student/*`)
- ✅ Get dashboard data
- ✅ Track dashboard actions
- ✅ Stream dashboard updates

#### Coaching OS Endpoints (`/api/v1/coaching/*`)
- ✅ Create/log habits
- ✅ Create goals
- ✅ Create reflections
- ✅ Get coaching summary

#### Missions MXP Endpoints (`/api/v1/missions/*`)
- ✅ Get recommended missions
- ✅ Submit mission
- ✅ Get mission status

#### Profiler Engine Endpoints (`/api/v1/profiler/*`)
- ✅ Start profiler session
- ✅ Submit answers
- ✅ Generate Future-You persona
- ✅ Get profiler status

#### Admin Endpoints (`/api/v1/*`)
- ✅ List/create roles
- ✅ Assign/revoke user roles
- ✅ List/create organizations
- ✅ Add organization members
- ✅ List audit logs
- ✅ Get audit statistics
- ✅ API key management

#### Health & Metrics (`/api/v1/health/*`, `/api/v1/metrics/*`)
- ✅ Health check endpoint
- ✅ Dashboard metrics

### Test Configuration

Configuration is defined in `pytest.ini`:
- Django settings: `core.settings.development`
- Test discovery: `test_*.py`, `*_test.py`
- Coverage: Excludes migrations, tests, venv
- Markers: Defined for test categorization

### Continuous Integration

Tests should be run in CI/CD pipeline:
```yaml
# Example GitHub Actions
- name: Run pytest tests
  run: |
    cd backend/django_app
    pytest --cov=. --cov-report=xml
```

### Best Practices

1. **Isolation**: Each test is independent and uses database transactions
2. **Fixtures**: Reuse fixtures for common setup (users, clients, roles)
3. **Markers**: Use markers to categorize and filter tests
4. **Coverage**: Maintain minimum 80% code coverage for endpoints
5. **Naming**: Use descriptive test names following `test_<scenario>_<expected_result>`
6. **Assertions**: Test both success and failure cases
7. **RBAC**: Test permissions for each role (admin, student, mentor, etc.)

### Adding New Endpoint Tests

When adding a new endpoint:

1. Create test file: `tests/test_<module>_endpoints.py`
2. Import fixtures from `conftest.py`
3. Create test classes for each endpoint
4. Test authentication, authorization, validation, and edge cases
5. Add appropriate markers
6. Run tests: `pytest tests/test_<module>_endpoints.py`

Example:
```python
@pytest.mark.django_db
@pytest.mark.newmodule
class TestNewEndpoint:
    def test_endpoint_success(self, authenticated_client):
        response = authenticated_client.get('/api/v1/new-endpoint')
        assert response.status_code == status.HTTP_200_OK
    
    def test_endpoint_unauthenticated(self, api_client):
        response = api_client.get('/api/v1/new-endpoint')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
```


