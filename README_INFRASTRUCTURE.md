# Infrastructure & CI/CD Setup

## Quick Reference

### Start Development
```bash
cd backend
docker-compose -f docker-compose.yml -f compose.override.dev.yml up
```

### Start Production
```bash
cd backend
docker-compose -f docker-compose.prod.yml -f compose.override.prod.yml up -d
```

### Run CI Locally
```bash
# Install pre-commit
pip install pre-commit
pre-commit install

# Run all checks
pre-commit run --all-files
```

### Merge OpenAPI Schemas
```bash
python shared/openapi/merge_openapi.py
```

## File Locations

### CI/CD
- `.github/workflows/ci.yml` - Continuous Integration
- `.github/workflows/deploy.yml` - Deployment Pipeline

### Docker
- `backend/docker/django.Dockerfile.prod` - Django production image
- `backend/docker/fastapi.Dockerfile.prod` - FastAPI production image
- `frontend/nextjs_app/Dockerfile` - Next.js production image
- `backend/docker-compose.prod.yml` - Production orchestration
- `backend/compose.override.*.yml` - Environment overrides

### Configuration
- `docker/nginx/nginx.conf` - NGINX reverse proxy
- `pyproject.toml` - Python tooling (Black, Ruff, Mypy)
- `mypy.ini` - Type checking config
- `.pre-commit-config.yaml` - Pre-commit hooks
- `frontend/nextjs_app/.eslintrc.json` - ESLint config
- `frontend/nextjs_app/.prettierrc` - Prettier config

### Monitoring
- `docker/monitoring/prometheus.yml` - Prometheus config
- `docker/monitoring/loki/logging.yml` - Loki config
- `backend/django_app/core/settings/metrics.py` - Django metrics
- `backend/fastapi_app/utils/metrics.py` - FastAPI metrics

### Database
- `backend/fastapi_app/alembic.ini` - Alembic configuration
- `backend/fastapi_app/migrations/` - Alembic migrations

### Documentation
- `DEPLOYMENT.md` - Complete deployment guide
- `INFRASTRUCTURE_SUMMARY.md` - Infrastructure overview

## Environment Setup

1. Copy environment templates:
   ```bash
   cp backend/django_app/.env.example backend/django_app/.env
   cp backend/fastapi_app/.env.example backend/fastapi_app/.env
   cp frontend/nextjs_app/.env.example frontend/nextjs_app/.env.local
   ```

2. Edit `.env` files with your values

3. For Docker Compose, copy:
   ```bash
   cp docker/.env.dev docker/.env  # For development
   # Or
   cp docker/.env.prod docker/.env  # For production
   ```

## Next Steps

1. Install dependencies:
   ```bash
   # Python
   pip install -r backend/django_app/requirements.txt
   pip install -r backend/fastapi_app/requirements.txt
   
   # Node
   cd frontend/nextjs_app && npm install
   ```

2. Set up pre-commit hooks:
   ```bash
   pip install pre-commit
   pre-commit install
   ```

3. Initialize Alembic (FastAPI):
   ```bash
   cd backend/fastapi_app
   alembic init migrations  # If not already done
   ```

4. Configure GitHub Secrets for CI/CD:
   - `GITHUB_TOKEN` (auto-provided)
   - `DJANGO_SECRET_KEY`
   - `POSTGRES_PASSWORD`
   - `FASTAPI_INTERNAL_API_KEY`
   - etc.

## Testing the Setup

### Validate Docker Compose
```bash
cd backend
docker-compose -f docker-compose.prod.yml config
```

### Test NGINX Config
```bash
docker run --rm -v $(pwd)/docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine nginx -t
```

### Validate OpenAPI Schemas
```bash
python shared/openapi/validate_schemas.py
```

### Run Code Quality Checks
```bash
# Python
black --check backend/
ruff check backend/
mypy backend/

# JavaScript
cd frontend/nextjs_app
npm run lint
npx prettier --check .
```

## Production Deployment Checklist

- [ ] Set all environment variables
- [ ] Configure SSL certificates
- [ ] Set up database backups
- [ ] Configure monitoring (Prometheus, Grafana)
- [ ] Set up log aggregation (Loki)
- [ ] Configure rate limiting
- [ ] Review security headers
- [ ] Set up alerting
- [ ] Test health checks
- [ ] Verify metrics endpoints
- [ ] Load test the application

