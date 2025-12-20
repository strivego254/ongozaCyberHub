# Login Fix - Student Dashboard

## Issue
"Invalid credentials" error when trying to login with `student@test.com`

## Root Cause
The test user didn't exist in the database. This has been fixed by creating the test users.

## Solution Applied

✅ **Created test users** using the management command:
```bash
python3 manage.py create_test_users
```

## Test Credentials

All test users use the password: **`testpass123`**

Available test users:
- **Student**: `student@test.com` / `testpass123`
- **Admin**: `admin@test.com` / `testpass123`
- **Mentor**: `mentor@test.com` / `testpass123`
- **Director**: `director@test.com` / `testpass123`
- **Sponsor**: `sponsor@test.com` / `testpass123`
- **Analyst**: `analyst@test.com` / `testpass123`

## Important: Frontend Configuration

If Django is running on **port 8001** (local) instead of **port 8000** (Docker), you need to configure the frontend:

### Option 1: Create `.env.local` file (Recommended)

Create file: `frontend/nextjs_app/.env.local`

```bash
cd frontend/nextjs_app
cat > .env.local << EOF
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8001
NEXT_PUBLIC_FASTAPI_API_URL=http://localhost:8001
EOF
```

Then **restart the frontend**:
```bash
# Stop the frontend (Ctrl+C) and restart:
npm run dev
```

### Option 2: Use Docker Django (Port 8000)

If you want to use Docker's Django on port 8000:
1. Stop local Django (Ctrl+C in Django terminal)
2. Frontend will automatically use port 8000

## Verification

Login is working! Tested with:
```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"testpass123"}'
```

✅ Returns access token and user data successfully.

## Next Steps

1. **If using local Django (8001)**: Create `.env.local` and restart frontend
2. **If using Docker Django (8000)**: No changes needed, just stop local Django
3. **Try logging in again** with `student@test.com` / `testpass123`

The login should now work! 🎉

