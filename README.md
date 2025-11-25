# Ongoza CyberHub

A hybrid microservices platform for cyber/AI learning and training, built with Django, FastAPI, and Next.js.

## Tech Stack

### Backend Services
- **Django 5+** - Core business logic API with Django REST Framework
- **FastAPI** - AI, vector processing, and recommendation engine
- **PostgreSQL** - Relational database for Django
- **PostgreSQL + pgvector** - Vector database for FastAPI

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## Service Responsibilities

### Django API (Port 8000)
- User authentication and authorization (JWT)
- User management
- Organization management
- Progress tracking
- Business logic and data validation
- Relational data storage

### FastAPI AI Service (Port 8001)
- AI-powered recommendations
- Embedding generation and storage
- Personality analysis
- Vector similarity search
- Content recommendations

### Next.js Frontend (Port 3000)
- User interface and dashboards
- API integration with both backends
- Client-side routing
- State management

## Folder Structure

```
/
├── backend/
│   ├── django_app/          # Django application
│   │   ├── core/           # Django project core
│   │   ├── api/            # API versioning
│   │   ├── users/          # User management app
│   │   ├── organizations/  # Organization app
│   │   ├── progress/       # Progress tracking app
│   │   └── shared_schemas/ # DRF serializers
│   │
│   ├── fastapi_app/        # FastAPI application
│   │   ├── routers/        # API routers (v1)
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── vector_store/   # Vector DB clients
│   │
│   ├── docker/             # Dockerfiles and scripts
│   └── docker-compose.yml  # Docker Compose configuration
│
├── frontend/
│   └── nextjs_app/         # Next.js application
│       ├── app/            # App Router pages
│       ├── components/     # React components
│       ├── services/       # API clients
│       └── hooks/          # Custom hooks
│
├── shared/
│   ├── openapi/            # OpenAPI schemas
│   └── schemas/           # Shared schema definitions
│
└── docs/                   # Documentation
    ├── architecture.md
    ├── backend_structure.md
    ├── data_flow.md
    ├── api_contracts.md
    └── pseudocode/
```

## Environment Setup

1. **Copy environment template:**
   ```bash
   # See ENV_TEMPLATE.md for all environment variables
   cp ENV_TEMPLATE.md .env  # Or create .env files in each service directory
   ```

2. **Configure environment variables:**
   - Django: `backend/django_app/.env`
   - FastAPI: `backend/fastapi_app/.env`
   - Next.js: `frontend/nextjs_app/.env.local`
   - Landing Pages: `frontend/landing_pages/.env`

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.12+ (for local development)
- Node.js 18+ (for frontend development)

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ongozacyberhub
   ```

2. **Start all services**
   ```bash
   cd backend
   docker-compose up -d
   ```

3. **Run Django migrations**
   ```bash
   docker-compose exec django python manage.py migrate
   ```

4. **Create superuser (optional)**
   ```bash
   docker-compose exec django python manage.py createsuperuser
   ```

5. **Access services**
   - Django API: http://localhost:8000
   - Django Admin: http://localhost:8000/admin
   - Django API Docs: http://localhost:8000/api/schema/swagger-ui/
   - FastAPI: http://localhost:8001
   - FastAPI Docs: http://localhost:8001/docs
   - Next.js Frontend: http://localhost:3000 (run separately)

### Local Development Setup

#### Django Backend

1. **Navigate to Django app**
   ```bash
   cd backend/django_app
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   export DJANGO_SECRET_KEY="your-secret-key"
   export DB_NAME="ongozacyberhub"
   export DB_USER="postgres"
   export DB_PASSWORD="postgres"
   export DB_HOST="localhost"
   export DB_PORT="5432"
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

#### FastAPI Backend

1. **Navigate to FastAPI app**
   ```bash
   cd backend/fastapi_app
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   export VECTOR_DB_HOST="localhost"
   export VECTOR_DB_PORT="5433"
   export VECTOR_DB_NAME="ongozacyberhub_vector"
   export DJANGO_API_URL="http://localhost:8000"
   ```

5. **Start development server**
   ```bash
   uvicorn main:app --reload --port 8001
   ```

#### Next.js Frontend

1. **Navigate to Next.js app**
   ```bash
   cd frontend/nextjs_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API URLs
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Django ↔ FastAPI Communication

### Authentication
Both services use JWT tokens with a shared secret key. Django issues tokens, and FastAPI validates them.

### Communication Pattern
- **FastAPI → Django**: FastAPI makes HTTP requests to Django endpoints using `httpx`
- **Django → FastAPI**: Django can make HTTP requests to FastAPI endpoints

### Example: FastAPI calling Django
```python
# In FastAPI service
import httpx

async def get_user_progress(user_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.DJANGO_API_URL}/api/v1/progress/",
            params={"user": user_id},
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.json()
```

## Schema Synchronization

Schemas are maintained in two places:
1. **Django**: `backend/django_app/shared_schemas/` (DRF Serializers)
2. **FastAPI**: `backend/fastapi_app/schemas/` (Pydantic Models)

### Keeping Schemas in Sync

1. Update shared schema definitions in `/shared/schemas/base_schemas.md`
2. Update Django serializers in `shared_schemas/`
3. Update FastAPI Pydantic models in `schemas/`
4. Regenerate OpenAPI schemas (see below)

### Schema Validation
Both services validate incoming requests against their schemas. Ensure both implementations match the shared definitions.

## OpenAPI Schema Generation

### Django
```bash
cd backend/django_app
python manage.py spectacular --file ../../shared/openapi/openapi_django.json
```

Access interactive docs at: http://localhost:8000/api/schema/swagger-ui/

### FastAPI
FastAPI automatically generates OpenAPI schema. Access it at:
- JSON: http://localhost:8001/openapi.json
- Interactive Docs: http://localhost:8001/docs

To save FastAPI schema:
```bash
curl http://localhost:8001/openapi.json > shared/openapi/openapi_fastapi.json
```

## API Versioning

Both services use URL-based versioning:
- Django: `/api/v1/...`
- FastAPI: `/api/v1/...`

Future versions will use `/api/v2/`, etc.

## Docker Commands

### Start services
```bash
cd backend
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f [service_name]
```

### Execute commands in containers
```bash
# Django migrations
docker-compose exec django python manage.py migrate

# Django shell
docker-compose exec django python manage.py shell

# FastAPI shell
docker-compose exec fastapi python
```

### Rebuild containers
```bash
docker-compose build
docker-compose up -d
```

## Development Workflow

1. **Make changes** to code
2. **Run tests** (when implemented)
3. **Update schemas** if needed
4. **Regenerate OpenAPI** schemas
5. **Commit changes**

## Environment Variables

### Django
- `DJANGO_SECRET_KEY` - Django secret key
- `DB_NAME` - PostgreSQL database name
- `DB_USER` - PostgreSQL user
- `DB_PASSWORD` - PostgreSQL password
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `FASTAPI_BASE_URL` - FastAPI service URL

### FastAPI
- `VECTOR_DB_HOST` - Vector database host
- `VECTOR_DB_PORT` - Vector database port
- `VECTOR_DB_NAME` - Vector database name
- `DJANGO_API_URL` - Django API URL
- `USE_PINECONE` - Use Pinecone instead of PGVector (true/false)
- `JWT_SECRET_KEY` - Shared JWT secret (must match Django)

### Next.js
- `NEXT_PUBLIC_DJANGO_API_URL` - Django API URL
- `NEXT_PUBLIC_FASTAPI_API_URL` - FastAPI API URL

## Database Setup

### Relational Database (PostgreSQL)
Used by Django for structured data storage.

### Vector Database (PostgreSQL + pgvector)
Used by FastAPI for embedding storage and similarity search.

The pgvector extension is automatically enabled in the Docker setup.

## Testing

### Django
```bash
cd backend/django_app
python manage.py test
```

### FastAPI
```bash
cd backend/fastapi_app
pytest
```

### Frontend
```bash
cd frontend/nextjs_app
npm test
```

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- [Architecture](./docs/architecture.md) - System architecture overview
- [Backend Structure](./docs/backend_structure.md) - Backend service breakdown
- [Data Flow](./docs/data_flow.md) - Data flow between services
- [API Contracts](./docs/api_contracts.md) - API endpoint documentation
- [Pseudocode](./docs/pseudocode/) - Algorithm pseudocode

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Specify your license here]

## Support

For support, please open an issue in the repository or contact the development team.
