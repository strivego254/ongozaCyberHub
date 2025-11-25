# Development Authentication Setup

## Overview

For development purposes, we use a simplified authentication system that can be hardened later for production. This document explains how to set up and test authentication, endpoints, and RBAC.

## Quick Setup

### 1. Create Test Users with Roles

```bash
cd backend/django_app
python manage.py shell
```

```python
from users.models import User, Role, UserRole

# Create test users
admin_user = User.objects.create_user(
    email='admin@test.com',
    username='admin',
    password='testpass123',
    first_name='Admin',
    last_name='User',
    account_status='active',
    email_verified=True,
    is_staff=True,
    is_superuser=True
)

student_user = User.objects.create_user(
    email='student@test.com',
    username='student',
    password='testpass123',
    first_name='Student',
    last_name='User',
    account_status='active',
    email_verified=True
)

mentor_user = User.objects.create_user(
    email='mentor@test.com',
    username='mentor',
    password='testpass123',
    first_name='Mentor',
    last_name='User',
    account_status='active',
    email_verified=True
)

# Get roles
admin_role = Role.objects.get(name='admin')
student_role = Role.objects.get(name='student')
mentor_role = Role.objects.get(name='mentor')

# Assign roles
UserRole.objects.create(user=admin_user, role=admin_role, scope='global')
UserRole.objects.create(user=student_user, role=student_role, scope='global')
UserRole.objects.create(user=mentor_user, role=mentor_role, scope='global')

print("Test users created!")
print(f"Admin: admin@test.com / testpass123")
print(f"Student: student@test.com / testpass123")
print(f"Mentor: mentor@test.com / testpass123")
```

### 2. Environment Variables

Ensure `.env` has:

```env
DEBUG=True
DJANGO_SECRET_KEY=dev-secret-key-change-in-production
```

## Testing Endpoints

### Authentication Endpoints

#### 1. Signup

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "SecurePass123!",
    "first_name": "New",
    "last_name": "User",
    "country": "BW"
  }'
```

#### 2. Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "testpass123",
    "device_fingerprint": "test-device"
  }'
```

**Save the tokens:**
```bash
export ACCESS_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."
export REFRESH_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."
```

#### 3. Get Current User

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Role-Based Endpoints

#### 4. List Roles (Authenticated)

```bash
curl http://localhost:8000/api/v1/roles \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### 5. Assign Role (Admin/Director Only)

```bash
curl -X POST http://localhost:8000/api/v1/users/2/roles \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": 3,
    "scope": "global"
  }'
```

#### 6. List Organizations

```bash
curl http://localhost:8000/api/v1/orgs \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### 7. Create Organization

```bash
curl -X POST http://localhost:8000/api/v1/orgs \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Organization",
    "slug": "test-org",
    "org_type": "sponsor"
  }'
```

#### 8. List Audit Logs

```bash
curl http://localhost:8000/api/v1/audit-logs \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### 9. Get Audit Statistics

```bash
curl http://localhost:8000/api/v1/audit-logs/stats \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## RBAC Testing

### Test Case 1: Student Access

```bash
# Login as student
STUDENT_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"testpass123"}' \
  | jq -r '.access_token')

# Try to access admin endpoint (should fail or return limited data)
curl http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

### Test Case 2: Admin Access

```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"testpass123"}' \
  | jq -r '.access_token')

# Access admin endpoints (should succeed)
curl http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl http://localhost:8000/api/v1/audit-logs \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Test Case 3: Role Assignment

```bash
# Admin assigns mentor role to student
curl -X POST http://localhost:8000/api/v1/users/2/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": 2,
    "scope": "global"
  }'

# Verify role assignment
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  | jq '.roles'
```

## Test Script

Create `test_endpoints.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8000/api/v1"

echo "=== Testing Authentication ==="

# Signup
echo "1. Testing signup..."
curl -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "User"
  }' | jq '.'

# Login
echo "2. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "testpass123"
  }')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "Access Token: ${ACCESS_TOKEN:0:50}..."

# Get current user
echo "3. Testing get current user..."
curl "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

# List roles
echo "4. Testing list roles..."
curl "$BASE_URL/roles" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

echo "=== Tests Complete ==="
```

## Development Mode Features

### Simplified Auth (Current)

- ✅ Email + password login
- ✅ JWT tokens (15 min access, 30 day refresh)
- ✅ Role-based access control
- ✅ Basic permission checks

### Not Yet Implemented (For Production)

- ⏳ MFA enforcement
- ⏳ Rate limiting
- ⏳ IP whitelisting
- ⏳ Advanced risk scoring
- ⏳ SSO integration

## Common Test Users

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| admin@test.com | testpass123 | Admin | Full platform access |
| student@test.com | testpass123 | Student | Personal dashboard, missions |
| mentor@test.com | testpass123 | Mentor | Mentee management, reviews |
| director@test.com | testpass123 | Program Director | Program management, analytics |

## Troubleshooting

### Token Expired

```bash
# Refresh token
curl -X POST http://localhost:8000/api/v1/auth/token/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"
```

### Permission Denied

Check user roles:
```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  | jq '.roles'
```

### Invalid Credentials

Verify user exists and password is correct:
```python
python manage.py shell
>>> from users.models import User
>>> user = User.objects.get(email='student@test.com')
>>> user.check_password('testpass123')
True
```

## Next Steps for Production Hardening

1. Enable MFA for all admin/director accounts
2. Implement rate limiting on auth endpoints
3. Add IP whitelisting for admin access
4. Enable advanced risk scoring
5. Add SSO integration
6. Implement audit log alerts
7. Add session management UI
8. Enable password complexity requirements

