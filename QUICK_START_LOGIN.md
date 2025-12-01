# Quick Start: Fixing Mentor Login

## Problem
You're seeing "An error occurred during login" when trying to sign in as mentor.

## Root Cause
The Django backend server is not running on port 8000.

## Solution

### Step 1: Start Django Backend

Open a new terminal and run:

```bash
cd backend/django_app
bash start_server.sh
```

Or manually:

```bash
cd backend/django_app
source venv/bin/activate  # If venv exists
python manage.py runserver 0.0.0.0:8000
```

### Step 2: Verify Django is Running

In another terminal, test the health endpoint:

```bash
curl http://localhost:8000/api/v1/health/
```

You should see a JSON response.

### Step 3: Test Mentor Login

The mentor test user credentials are:
- **Email**: `mentor@test.com`
- **Password**: `testpass123`

### Step 4: Try Login Again

1. Go to `http://localhost:3001/login/mentor`
2. Enter credentials:
   - Email: `mentor@test.com`
   - Password: `testpass123`
3. Click "Sign In"

You should be redirected to `/dashboard/mentor` on successful login.

## Troubleshooting

### If Django won't start:

1. **Virtual environment not found:**
   ```bash
   cd backend/django_app
   bash quick_start.sh
   ```

2. **Database connection error:**
   - Ensure PostgreSQL is running
   - Check `.env` file has correct database credentials
   - Create database: `python manage.py create_db`

3. **Port 8000 already in use:**
   - Stop other services on port 8000
   - Or change port: `python manage.py runserver 0.0.0.0:8001`

### If login still fails:

1. **Check Django logs** for error messages
2. **Verify mentor user exists:**
   ```bash
   python manage.py shell
   >>> from users.models import User
   >>> User.objects.filter(email='mentor@test.com').exists()
   ```

3. **Create mentor user if missing:**
   ```bash
   python manage.py create_test_users
   ```

## Test Users

All test users use password: `testpass123`

- `admin@test.com` - Admin
- `student@test.com` - Student  
- `mentor@test.com` - Mentor
- `director@test.com` - Program Director

## Environment Variables

Make sure your frontend `.env.local` (if exists) has:

```
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
```

## Next Steps

Once login works:
1. You'll be redirected to `/dashboard/mentor`
2. The dashboard will load mentor-specific features
3. You can access mentee management, sessions, etc.

