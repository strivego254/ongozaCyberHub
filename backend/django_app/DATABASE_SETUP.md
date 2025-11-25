# Database Setup Complete

## Configuration Summary

✅ Django is now configured to connect to PostgreSQL using environment variables from `.env` file.

## What Was Configured

1. **Environment Variable Loading**
   - Added `python-dotenv` support in `core/settings/base.py`
   - Automatically loads `.env` file from `backend/django_app/` directory
   - Falls back to parent directory if not found

2. **Database Configuration**
   - Database settings read from environment variables:
     - `DB_NAME` (default: ongozacyberhub)
     - `DB_USER` (default: postgres)
     - `DB_PASSWORD` (default: postgres)
     - `DB_HOST` (default: localhost)
     - `DB_PORT` (default: 5432)

3. **Database Creation Tools**
   - Django management command: `python manage.py create_db`
   - Python script: `scripts/create_db.py`
   - Shell script: `scripts/create_db.sh`

## Next Steps

### 1. Create `.env` File

Create a `.env` file in `backend/django_app/` directory:

```bash
cd backend/django_app
cat > .env << 'EOF'
# Django Settings
DJANGO_SECRET_KEY=django-insecure-dev-key-change-in-production
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
EOF
```

**Important:** Replace `your-postgres-password` with your actual PostgreSQL password.

### 2. Install Dependencies

```bash
cd backend/django_app
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Create Database

**Option A: Using Django Management Command (Recommended)**
```bash
python manage.py create_db
```

**Option B: Using PostgreSQL CLI**
```bash
psql -U postgres
CREATE DATABASE ongozacyberhub;
\q
```

**Option C: Using Python Script**
```bash
python scripts/create_db.py
```

### 4. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 6. Start Development Server

```bash
python manage.py runserver
```

## Quick Start (All-in-One)

Run the quick start script:

```bash
cd backend/django_app
./quick_start.sh
```

This will:
- Create virtual environment
- Install dependencies
- Create `.env` file (if missing)
- Create database
- Run migrations

## Verify Database Connection

Test the database connection:

```bash
python manage.py dbshell
```

Or check from Django shell:

```bash
python manage.py shell
>>> from django.db import connection
>>> connection.ensure_connection()
>>> print("Database connected successfully!")
```

## Troubleshooting

### PostgreSQL Not Running

**Linux:**
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

**macOS:**
```bash
brew services start postgresql
```

**Windows:**
Check Services panel or:
```bash
pg_ctl start
```

### Connection Refused

1. Check PostgreSQL is running
2. Verify credentials in `.env` file
3. Check firewall settings
4. Verify PostgreSQL is listening on correct port: `netstat -an | grep 5432`

### Permission Denied

Ensure your PostgreSQL user has permission to create databases:

```sql
psql -U postgres
ALTER USER postgres CREATEDB;
```

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Django secret key | `django-insecure-change-me-in-production` |
| `DEBUG` | Debug mode | `False` |
| `DB_NAME` | Database name | `ongozacyberhub` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `FASTAPI_BASE_URL` | FastAPI service URL | `http://localhost:8001` |
| `CORS_ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:3000,http://127.0.0.1:3000` |

## Next: API Layer

Once the database is set up, you can:
1. Create API endpoints
2. Test API endpoints
3. Set up authentication
4. Connect frontend


