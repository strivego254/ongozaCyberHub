# Django App Setup Guide

## Prerequisites

- Python 3.12+
- PostgreSQL 14+ installed and running
- Virtual environment (recommended)

## Step 1: Install Dependencies

```bash
cd backend/django_app
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Step 2: Configure Environment Variables

Create a `.env` file in the `backend/django_app/` directory:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True

# Database Configuration
DB_NAME=ongozacyberhub
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_HOST=localhost
DB_PORT=5432

# FastAPI Communication
FASTAPI_BASE_URL=http://localhost:8001

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Step 3: Create Database

### Option 1: Using Django Management Command (Recommended)

```bash
python manage.py create_db
```

### Option 2: Using PostgreSQL CLI

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ongozacyberhub;

# Exit psql
\q
```

### Option 3: Using the Python Script

```bash
python scripts/create_db.py
```

## Step 4: Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

## Step 5: Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

## Step 6: Start Development Server

```bash
python manage.py runserver
```

The server will start at http://localhost:8000

## Verify Setup

1. **Check database connection:**
   ```bash
   python manage.py dbshell
   ```

2. **Access admin panel:**
   - URL: http://localhost:8000/admin
   - Use superuser credentials

3. **Access API documentation:**
   - Swagger UI: http://localhost:8000/api/schema/swagger-ui/
   - ReDoc: http://localhost:8000/api/schema/redoc/

4. **Test health endpoint:**
   ```bash
   curl http://localhost:8000/api/v1/health/
   ```

## Troubleshooting

### Database Connection Error

If you get a connection error:
1. Verify PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or check Services (Windows)
2. Check credentials in `.env` file
3. Verify database exists: `psql -U postgres -l`

### Migration Errors

If migrations fail:
1. Check database connection
2. Ensure all apps are in `INSTALLED_APPS`
3. Try: `python manage.py migrate --run-syncdb`

### Environment Variables Not Loading

1. Ensure `.env` file exists in `backend/django_app/` directory
2. Check file permissions
3. Verify `python-dotenv` is installed

## Next Steps

- Set up FastAPI service
- Configure frontend to connect to Django API
- Set up authentication endpoints
- Create initial data fixtures


