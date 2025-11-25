# Endpoint Testing Guide

## Quick Start

### 1. Create Test Users

```bash
cd backend/django_app
python manage.py create_test_users
```

This creates test users for all roles:
- `admin@test.com` / `testpass123` - Admin
- `student@test.com` / `testpass123` - Student
- `mentor@test.com` / `testpass123` - Mentor
- `director@test.com` / `testpass123` - Program Director
- `sponsor@test.com` / `testpass123` - Sponsor Admin
- `analyst@test.com` / `testpass123` - Analyst

### 2. Start Server

```bash
python manage.py runserver
```

## Test Cases

### Test Case 1: Authentication Flow

```bash
# 1. Signup
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "TestPass123!",
    "first_name": "New",
    "last_name": "User"
  }'

# 2. Login
RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "testpass123",
    "device_fingerprint": "test-device"
  }')

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refresh_token')

# 3. Get Current User
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

# 4. Refresh Token
curl -X POST http://localhost:8000/api/v1/auth/token/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}" | jq '.'

# 5. Logout
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"
```

### Test Case 2: RBAC - Student Access

```bash
# Login as student
STUDENT_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"testpass123"}')

STUDENT_TOKEN=$(echo $STUDENT_RESPONSE | jq -r '.access_token')

# Test student endpoints (should work)
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.roles'

curl http://localhost:8000/api/v1/roles \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.'

# Test admin endpoints (should fail or return limited data)
curl http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.'
```

### Test Case 3: RBAC - Admin Access

```bash
# Login as admin
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"testpass123"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.access_token')

# Test admin endpoints (should work)
curl http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

curl http://localhost:8000/api/v1/audit-logs \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

curl http://localhost:8000/api/v1/audit-logs/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
```

### Test Case 4: Role Assignment

```bash
# Admin assigns role to student
curl -X POST http://localhost:8000/api/v1/users/2/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": 2,
    "scope": "global"
  }' | jq '.'

# Verify role assignment
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.roles'

# Revoke role
curl -X DELETE http://localhost:8000/api/v1/users/2/roles/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
```

### Test Case 5: Organization Management

```bash
# Create organization
ORG_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/orgs \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Organization",
    "slug": "test-org",
    "org_type": "sponsor"
  }')

ORG_SLUG=$(echo $ORG_RESPONSE | jq -r '.slug')

# List organizations
curl http://localhost:8000/api/v1/orgs \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Add member to organization
curl -X POST http://localhost:8000/api/v1/orgs/$ORG_SLUG/members \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "role_id": 4
  }' | jq '.'
```

### Test Case 6: API Key Management

```bash
# Create API key
API_KEY_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/api-keys \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test API Key",
    "key_type": "service",
    "scopes": ["read:users", "write:users"]
  }')

API_KEY_ID=$(echo $API_KEY_RESPONSE | jq -r '.id')
API_KEY_VALUE=$(echo $API_KEY_RESPONSE | jq -r '.key')

echo "API Key: $API_KEY_VALUE"
echo "Save this key - it won't be shown again!"

# List API keys
curl http://localhost:8000/api/v1/api-keys \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Revoke API key
curl -X DELETE http://localhost:8000/api/v1/api-keys/$API_KEY_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
```

## Complete Test Script

Save as `test_all_endpoints.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8000/api/v1"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Ongoza CyberHub Endpoint Testing ===${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}1. Health Check...${NC}"
curl -s "$BASE_URL/../health/" | jq '.' || echo "Failed"
echo ""

# Test 2: Signup
echo -e "${YELLOW}2. Testing Signup...${NC}"
curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "User"
  }' | jq '.'
echo ""

# Test 3: Login as Student
echo -e "${YELLOW}3. Testing Login (Student)...${NC}"
STUDENT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"testpass123"}')

STUDENT_TOKEN=$(echo $STUDENT_RESPONSE | jq -r '.access_token // empty')
if [ -z "$STUDENT_TOKEN" ]; then
  echo -e "${RED}Login failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Student login successful${NC}"
echo ""

# Test 4: Get Current User
echo -e "${YELLOW}4. Testing Get Current User...${NC}"
curl -s "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.roles'
echo ""

# Test 5: List Roles
echo -e "${YELLOW}5. Testing List Roles...${NC}"
curl -s "$BASE_URL/roles" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.results | length'
echo ""

# Test 6: Login as Admin
echo -e "${YELLOW}6. Testing Login (Admin)...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"testpass123"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.access_token // empty')
if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}Admin login failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Admin login successful${NC}"
echo ""

# Test 7: List Users (Admin)
echo -e "${YELLOW}7. Testing List Users (Admin)...${NC}"
curl -s "$BASE_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.results | length'
echo ""

# Test 8: Audit Logs (Admin)
echo -e "${YELLOW}8. Testing Audit Logs (Admin)...${NC}"
curl -s "$BASE_URL/audit-logs/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

echo -e "${GREEN}=== Testing Complete ===${NC}"
```

Make executable:
```bash
chmod +x test_all_endpoints.sh
./test_all_endpoints.sh
```

## Expected Results

### Student Endpoints
- ✅ `/auth/me` - Returns user data with student role
- ✅ `/roles` - Lists all roles (read-only)
- ❌ `/users` - Should return 403 or limited data
- ❌ `/audit-logs` - Should return 403 or limited data

### Admin Endpoints
- ✅ `/auth/me` - Returns user data with admin role
- ✅ `/users` - Lists all users
- ✅ `/roles` - Lists all roles
- ✅ `/audit-logs` - Lists all audit logs
- ✅ `/audit-logs/stats` - Returns statistics
- ✅ `/users/{id}/roles` - Can assign/revoke roles

## Troubleshooting

### 401 Unauthorized
- Check token is valid and not expired
- Verify user exists and is active
- Check token format: `Bearer <token>`

### 403 Forbidden
- User doesn't have required role/permission
- Check user roles: `GET /auth/me`

### 404 Not Found
- Endpoint doesn't exist
- Check URL path matches API documentation
- Verify server is running

### 500 Server Error
- Check Django server logs
- Verify database is accessible
- Check environment variables

## Next Steps

1. Test all endpoints with different roles
2. Verify RBAC permissions work correctly
3. Test error handling
4. Test token refresh flow
5. Test organization management
6. Test API key management

