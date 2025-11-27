# Deployment Guide

## Overview

This document describes the CI/CD infrastructure, deployment workflows, and production setup for the Ongoza CyberHub hybrid application (Django + FastAPI + Next.js).

## Architecture

- **Django**: REST API backend (port 8000)
- **FastAPI**: AI/ML services (port 8001)
- **Next.js**: Frontend application (port 3000)
- **NGINX**: Reverse proxy and API gateway
- **PostgreSQL**: Relational database (port 5432)
- **PostgreSQL + pgvector**: Vector database (port 5433)
- **Redis**: Caching and async tasks (port 6379)

## CI/CD Pipeline

### GitHub Actions Workflows

#### CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and pull request:

- **Python Linting**: Black, Ruff, Mypy for Django and FastAPI
- **JavaScript Linting**: ESLint, Prettier for Next.js
- **Build Validation**: Validates all services build successfully
- **Tests**: Runs Django and FastAPI test suites
- **Docker Compose Validation**: Validates docker-compose configuration
- **Schema Validation**: Validates OpenAPI schema sync

#### Deploy Pipeline (`.github/workflows/deploy.yml`)

Runs on push to `main`:

- **Build & Push**: Builds and pushes Docker images to GitHub Container Registry
- **Generate OpenAPI**: Fetches and merges OpenAPI schemas
- **Deploy Staging**: Auto-deploys to staging environment
- **Deploy Production**: Manual approval required for production

## Environment Configuration

### Environment Files

- `env/.env.example` - Root environment template
- `backend/django_app/.env.example` - Django configuration
- `backend/fastapi_app/.env.example` - FastAPI configuration
- `frontend/nextjs_app/.env.example` - Next.js configuration
- `docker/.env.dev` - Development Docker environment
- `docker/.env.staging` - Staging Docker environment
- `docker/.env.prod` - Production Docker environment

### Key Environment Variables

#### Django
- `DJANGO_SECRET_KEY` - Django secret key (min 50 chars)
- `DB_*` - PostgreSQL connection settings
- `REDIS_*` - Redis connection settings
- `FASTAPI_INTERNAL_API_KEY` - Internal API key for FastAPI calls
- `GOOGLE_OAUTH_CLIENT_ID` - Google SSO client ID
- `ALLOWED_HOSTS` - Comma-separated list of allowed hosts

#### FastAPI
- `VECTOR_DB_*` - Vector database connection settings
- `DJANGO_INTERNAL_API_KEY` - Internal API key for Django calls
- `EMBEDDING_MODEL` - Embedding model name
- `FASTAPI_WORKERS` - Number of Uvicorn workers

#### Next.js
- `NEXT_PUBLIC_DJANGO_API_URL` - Public Django API URL
- `NEXT_PUBLIC_FASTAPI_API_URL` - Public FastAPI API URL
- `NEXT_PUBLIC_FRONTEND_URL` - Frontend URL

## Docker Setup

### Production Dockerfiles

- `backend/docker/django.Dockerfile.prod` - Multi-stage Django build with Gunicorn
- `backend/docker/fastapi.Dockerfile.prod` - Multi-stage FastAPI build with Uvicorn
- `frontend/nextjs_app/Dockerfile` - Multi-stage Next.js build with standalone output

### Docker Compose

#### Development
```bash
cd backend
docker-compose -f docker-compose.yml -f compose.override.dev.yml up
```

#### Staging
```bash
cd backend
docker-compose -f docker-compose.prod.yml -f compose.override.staging.yml up -d
```

#### Production
```bash
cd backend
docker-compose -f docker-compose.prod.yml -f compose.override.prod.yml up -d
```

## NGINX Configuration

NGINX acts as reverse proxy and API gateway:

- `/api/*` → Django backend (port 8000)
- `/ai/*` → FastAPI backend (port 8001)
- `/` → Next.js frontend (port 3000)
- `/static/` → Django static files
- `/media/` → Django media files

### Security Features

- Rate limiting (per endpoint)
- CORS headers
- Security headers (X-Frame-Options, HSTS, etc.)
- SSL/TLS termination (configured in production)

## Database Migrations

### Django Migrations

```bash
# Check for pending migrations
docker-compose exec django python manage.py migrate --check

# Run migrations
docker-compose exec django python manage.py migrate

# Create new migrations
docker-compose exec django python manage.py makemigrations
```

### FastAPI Migrations (Alembic)

```bash
# Initialize Alembic (first time)
docker-compose exec fastapi alembic init migrations

# Create migration
docker-compose exec fastapi alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec fastapi alembic upgrade head
```

## Code Quality

### Pre-commit Hooks

Install pre-commit hooks:
```bash
pip install pre-commit
pre-commit install
```

### Python Tools

- **Black**: Code formatting
- **Ruff**: Fast Python linter
- **Mypy**: Type checking

Configuration: `pyproject.toml`, `mypy.ini`

### JavaScript/TypeScript Tools

- **ESLint**: Linting
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking

Configuration: `.eslintrc.json`, `.prettierrc`, `tsconfig.json`

## OpenAPI Schema Management

### Merge Schemas

```bash
python shared/openapi/merge_openapi.py
```

This merges Django and FastAPI OpenAPI schemas into `shared/openapi/merged_openapi.json`.

### Validate Schemas

```bash
python shared/openapi/validate_schemas.py
```

## Monitoring & Logging

### Prometheus Metrics

- Django: `http://django:9091/metrics`
- FastAPI: `http://fastapi:9092/metrics`

### Logging

- Django logs: `/var/log/django/`
- FastAPI logs: `/var/log/fastapi/`
- NGINX logs: `/var/log/nginx/`

### Monitoring Stack

- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Visualization (port 3001)
- **Loki**: Log aggregation (port 3100)

Configuration files in `docker/monitoring/`

## Deployment Steps

### Initial Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd ongozaCyberHub
   ```

2. **Set up environment variables**
   ```bash
   cp env/.env.example .env
   cp backend/django_app/.env.example backend/django_app/.env
   cp backend/fastapi_app/.env.example backend/fastapi_app/.env
   cp frontend/nextjs_app/.env.example frontend/nextjs_app/.env.local
   # Edit .env files with your values
   ```

3. **Build and start services**
   ```bash
   cd backend
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. **Run migrations**
   ```bash
   docker-compose exec django python manage.py migrate
   docker-compose exec django python manage.py seed_roles_permissions
   docker-compose exec django python manage.py create_test_users
   ```

5. **Collect static files**
   ```bash
   docker-compose exec django python manage.py collectstatic --noinput
   ```

### Updates

1. **Pull latest changes**
   ```bash
   git pull
   ```

2. **Rebuild services**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

3. **Run migrations**
   ```bash
   docker-compose exec django python manage.py migrate
   ```

4. **Restart services**
   ```bash
   docker-compose -f docker-compose.prod.yml restart
   ```

## Kubernetes Deployment

Kubernetes manifests are not included but the Docker images are Kubernetes-ready. To deploy:

1. Build and push images to registry
2. Create Kubernetes manifests (deployments, services, ingress)
3. Apply manifests:
   ```bash
   kubectl apply -f k8s/
   ```

## Health Checks

All services include health check endpoints:

- Django: `GET /api/v1/health/`
- FastAPI: `GET /health`
- Next.js: `GET /api/health`
- NGINX: `GET /health`

## Troubleshooting

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f django
docker-compose logs -f fastapi
docker-compose logs -f nginx
```

### Check Service Status

```bash
docker-compose ps
docker-compose top
```

### Database Access

```bash
# PostgreSQL
docker-compose exec postgres-relational psql -U postgres -d ongozacyberhub

# Vector DB
docker-compose exec postgres-vector psql -U postgres -d ongozacyberhub_vector
```

### Restart Services

```bash
docker-compose restart django fastapi nextjs nginx
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Set strong `DJANGO_SECRET_KEY`
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Review and rotate API keys

## Backup & Recovery

### Database Backup

```bash
# Relational DB
docker-compose exec postgres-relational pg_dump -U postgres ongozacyberhub > backup.sql

# Vector DB
docker-compose exec postgres-vector pg_dump -U postgres ongozacyberhub_vector > backup_vector.sql
```

### Restore

```bash
docker-compose exec -T postgres-relational psql -U postgres ongozacyberhub < backup.sql
```



