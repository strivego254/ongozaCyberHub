# Backend Start Guide

## Quick Start Options

You have **two options** to start the backend:

### Option 1: Using Docker (Recommended - Already Running)

The backend is already running in Docker containers:

```bash
cd backend
docker compose ps  # Check status
docker compose logs django  # View logs
```

- **Django API**: http://localhost:8000
- **Frontend**: http://localhost:3000

### Option 2: Local Development (Manual Setup)

If you want to run Django locally instead of Docker:

#### Step 1: Install Dependencies

```bash
cd backend/django_app
source venv/bin/activate
pip install -r requirements.txt
```

**Note**: This will take several minutes to install all packages.

#### Step 2: Setup Environment Variables

Create a `.env` file in `backend/django_app/`:

```bash
# Django Settings
DJANGO_SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True

# Database Configuration (Note: Using port 5434, not 5432)
DB_NAME=ongozacyberhub
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5434  # Changed from 5432 because local PostgreSQL uses 5432

# FastAPI Communication
FASTAPI_BASE_URL=http://localhost:8001

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001
```

#### Step 3: Run Migrations

```bash
python3 manage.py migrate
```

#### Step 4: Start the Server

Use the provided script:
```bash
bash start_server.sh
```

Or run directly:
```bash
source venv/bin/activate
python3 manage.py runserver 0.0.0.0:8000
```

## Common Issues

### "python: command not found"

**Solution**: Use `python3` instead of `python`

```bash
python3 manage.py runserver 0.0.0.0:8000
```

### "Virtual environment not found"

**Solution**: Create a virtual environment:

```bash
cd backend/django_app
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Database Connection Error

**Solution**: 
1. Make sure PostgreSQL is running (either Docker or local)
2. Check the port in `.env` file (should be 5434 if using Docker, 5432 if using local PostgreSQL)
3. Verify database credentials

### Port Already in Use

If port 8000 is already in use (from Docker):
- Stop Docker: `docker compose down`
- Or use a different port: `python3 manage.py runserver 0.0.0.0:8001`

## Current Status

✅ **Frontend**: Running on http://localhost:3000
✅ **Django (Docker)**: Running on http://localhost:8000 (unhealthy status, but responding)
⚠️ **FastAPI**: Not started (waiting for Django healthcheck)

You can access:
- Frontend: http://localhost:3000
- Django API: http://localhost:8000/api/v1/

