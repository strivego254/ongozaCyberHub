# Quick Start Guide - Backend Services

## Step-by-Step: Start PostgreSQL and Django Backend

### Step 1: Start PostgreSQL Database

Open a terminal and run:

```bash
# Check if PostgreSQL is installed and running
sudo systemctl status postgresql

# If it shows "inactive" or "failed", start it:
sudo systemctl start postgresql

# Enable it to start on boot (optional)
sudo systemctl enable postgresql

# Verify it's running
sudo systemctl status postgresql
```

**Expected output:** Should show "active (running)" in green.

### Step 2: Verify Database Exists

```bash
# Check if the database exists
sudo -u postgres psql -l | grep ongozacyberhub
```

If the database doesn't exist, create it:

```bash
# Option 1: Using Django command (recommended)
cd backend/django_app
source venv/bin/activate
python manage.py create_db

# Option 2: Using PostgreSQL directly
sudo -u postgres createdb ongozacyberhub
```

### Step 3: Start Django Backend

Open a **new terminal window** (keep PostgreSQL terminal open) and run:

```bash
# Navigate to Django app directory
cd "/home/fidel-ochieng-ogola/Fidel Ogola Personal Items/ONGOZA CYBER HUB PRODUCTION/ongozaCyberHub/backend/django_app"

# Activate virtual environment
source venv/bin/activate

# Start Django server
python manage.py runserver 0.0.0.0:8000
```

**Expected output:**
```
Starting development server at http://0.0.0.0:8000/
Quit the server with CONTROL-C.
```

### Step 4: Verify Everything is Working

Open a **third terminal** and test:

```bash
# Test Django health endpoint
curl http://localhost:8000/api/v1/health/

# Should return: {"status":"ok"}
```

## Quick One-Line Commands

If you prefer, you can use these scripts:

### Start PostgreSQL:
```bash
sudo systemctl start postgresql && sudo systemctl status postgresql
```

### Start Django (from backend/django_app directory):
```bash
cd backend/django_app && source venv/bin/activate && python manage.py runserver 0.0.0.0:8000
```

## Troubleshooting

### PostgreSQL won't start:
```bash
# Check PostgreSQL logs
sudo journalctl -u postgresql -n 50

# Try restarting
sudo systemctl restart postgresql
```

### Django can't connect to database:
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l | grep ongozacyberhub

# Test connection
cd backend/django_app
source venv/bin/activate
python manage.py dbshell
```

### Port 8000 already in use:
```bash
# Find what's using port 8000
sudo lsof -i :8000

# Kill the process or use different port
python manage.py runserver 0.0.0.0:8001
```

## What Should Be Running

After completing the steps, you should have:

1. ✅ **PostgreSQL** running on port 5432
2. ✅ **Django backend** running on port 8000
3. ✅ Database `ongozacyberhub` exists
4. ✅ Django can connect to database

## Next Steps

Once both services are running:
1. Open frontend: `http://localhost:3001`
2. Navigate to: `http://localhost:3001/login/mentor`
3. Login with:
   - Email: `mentor@test.com`
   - Password: `testpass123`

