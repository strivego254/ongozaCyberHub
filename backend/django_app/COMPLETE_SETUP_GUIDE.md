# Complete Setup Guide - Fixing Mentor Login

## Root Cause Analysis

You were **absolutely correct**! The login error is because:

1. ✅ **Django backend not running** (port 8000) - FIXED
2. ✅ **Missing dependencies** (python3-venv, requests) - FIXED  
3. ❌ **PostgreSQL database not running** (port 5432) - **THIS IS THE MAIN ISSUE**

Without PostgreSQL running, Django cannot:
- Connect to the database
- Run migrations (create tables)
- Create test users (including mentor@test.com)
- Authenticate login requests

## Complete Setup Steps

### Step 1: Start PostgreSQL Database

```bash
# Check if PostgreSQL is installed
sudo systemctl status postgresql

# If not installed, install it:
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Enable on boot
```

### Step 2: Create Database

```bash
cd backend/django_app
source venv/bin/activate

# Create the database (if it doesn't exist)
python manage.py create_db

# Or manually:
sudo -u postgres psql
CREATE DATABASE ongozacyberhub;
\q
```

### Step 3: Run Migrations (Create Tables)

```bash
# This creates all the database tables
python manage.py migrate
```

### Step 4: Seed Roles and Create Test Users

```bash
# Create roles and permissions
python manage.py seed_roles_permissions

# Create test users (including mentor@test.com)
python manage.py create_test_users
```

### Step 5: Start Django Server

```bash
# Start Django on port 8000
python manage.py runserver 0.0.0.0:8000
```

### Step 6: Test Login

Now try logging in:
- URL: `http://localhost:3001/login/mentor`
- Email: `mentor@test.com`
- Password: `testpass123`

## Quick Setup Script

I've created `setup_and_start.sh` which does steps 1-4, but you need PostgreSQL running first.

## Verification Checklist

Before trying to login, verify:

- [ ] PostgreSQL is running: `sudo systemctl status postgresql`
- [ ] Database exists: `sudo -u postgres psql -l | grep ongozacyberhub`
- [ ] Migrations applied: `python manage.py showmigrations` (all should show [X])
- [ ] Test users exist: `python manage.py shell` then `User.objects.filter(email='mentor@test.com').exists()`
- [ ] Django server running: `curl http://localhost:8000/api/v1/health/`

## Troubleshooting

### PostgreSQL Connection Refused

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql

# Check if it's listening on port 5432
sudo netstat -tuln | grep 5432
# or
sudo ss -tuln | grep 5432
```

### Database Doesn't Exist

```bash
# Create database using Django command
python manage.py create_db

# Or manually
sudo -u postgres createdb ongozacyberhub
```

### Test User Doesn't Exist

```bash
source venv/bin/activate
python manage.py create_test_users
```

### Django Server Won't Start

```bash
# Check for port conflicts
sudo lsof -i :8000

# Kill process if needed
sudo kill -9 <PID>

# Or use different port
python manage.py runserver 0.0.0.0:8001
```

## Summary

The login error happens because:
1. **PostgreSQL not running** → Django can't connect to database
2. **No database tables** → Migrations haven't run
3. **No test users** → `mentor@test.com` doesn't exist

Once PostgreSQL is running and you've completed the setup steps above, login will work!

