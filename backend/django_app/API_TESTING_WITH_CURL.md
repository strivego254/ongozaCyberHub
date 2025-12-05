# API Testing with cURL

## Quick Start

### 1. Authenticate and Get Token

**Note**: The login endpoint works with or without trailing slash: `/api/v1/auth/login` or `/api/v1/auth/login/`

```bash
curl -X 'POST' \
  'http://localhost:8000/api/v1/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "director@example.com",
    "password": "yourpassword"
  }'
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {...}
}
```

### 2. Extract and Use Token

**Important**: Always extract the token properly. If `$TOKEN` is empty, you'll get:
```json
{"detail":"Authorization header must contain two space-delimited values"}
```

**Correct way:**
```bash
# Extract token using Python (most reliable)
LOGIN_RESPONSE=$(curl -s -X POST 'http://localhost:8000/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email": "director@example.com", "password": "yourpassword"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

# Verify token is set
if [ -z "$TOKEN" ]; then
    echo "ERROR: Token extraction failed!"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Use token (note: use double quotes around $TOKEN)
curl -X 'GET' \
  'http://localhost:8000/api/v1/programs/' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $TOKEN"
```

**Or with jq (if installed):**
```bash
TOKEN=$(curl -s -X POST 'http://localhost:8000/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email": "director@example.com", "password": "yourpassword"}' \
  | jq -r '.access_token')

curl -X GET 'http://localhost:8000/api/v1/programs/' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json'
```

## Troubleshooting 401 Unauthorized

If you get `401 Unauthorized` after login, check:

1. **Token extraction failed**: Verify token is in response
   ```bash
   # Check login response
   curl -X POST 'http://localhost:8000/api/v1/auth/login' \
     -H 'Content-Type: application/json' \
     -d '{"email": "your-email@example.com", "password": "yourpassword"}' \
     | python3 -m json.tool
   ```

2. **Token variable empty**: Always verify before use
   ```bash
   if [ -z "$TOKEN" ]; then
       echo "ERROR: Token is empty!"
       exit 1
   fi
   ```

3. **Token format**: Should start with `eyJ` and be 200+ characters
   ```bash
   echo "Token: ${TOKEN:0:50}... (length: ${#TOKEN})"
   ```

4. **User permissions**: Check if user can access programs
   ```bash
   curl -X GET 'http://localhost:8000/api/v1/auth/me' \
     -H "Authorization: Bearer $TOKEN" \
     | python3 -m json.tool
   ```

See `DEBUG_AUTHENTICATION.md` for detailed troubleshooting.

## Complete Examples

### Authentication

```bash
# Login and extract token (with error checking)
LOGIN_RESPONSE=$(curl -s -X POST 'http://localhost:8000/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email": "director@example.com", "password": "yourpassword"}')

# Check for errors
if echo "$LOGIN_RESPONSE" | grep -q '"detail"'; then
    echo "Login failed:"
    echo "$LOGIN_RESPONSE" | python3 -m json.tool
    exit 1
fi

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

# Verify token
if [ -z "$TOKEN" ]; then
    echo "ERROR: Token extraction failed"
    exit 1
fi

# Trim whitespace
TOKEN=$(echo "$TOKEN" | tr -d '\n\r ')

echo "Token extracted successfully (${#TOKEN} chars)"
```

### Programs CRUD

```bash
# Set your token
TOKEN="your-access-token-here"

# List Programs
curl -X GET http://localhost:8000/api/v1/programs/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# Get Program by ID
curl -X GET http://localhost:8000/api/v1/programs/{program-id}/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# Create Program
curl -X POST http://localhost:8000/api/v1/programs/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Cybersecurity Fundamentals",
    "category": "technical",
    "description": "Learn cybersecurity basics",
    "duration_months": 6,
    "default_price": 1000.00,
    "currency": "USD",
    "status": "active"
  }'

# Update Program (PATCH)
curl -X PATCH http://localhost:8000/api/v1/programs/{program-id}/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Updated Program Name"
  }'

# Delete Program
curl -X DELETE http://localhost:8000/api/v1/programs/{program-id}/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

### Director Dashboard

```bash
# Get Dashboard Summary
curl -X GET http://localhost:8000/api/v1/director/dashboard/summary/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# List Cohorts
curl -X GET "http://localhost:8000/api/v1/director/dashboard/cohorts/?page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# Get Cohort Detail
curl -X GET http://localhost:8000/api/v1/director/dashboard/cohorts/{cohort-id}/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

### Tracks

```bash
# List Tracks
curl -X GET "http://localhost:8000/api/v1/tracks/?program_id={program-id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# Create Track
curl -X POST http://localhost:8000/api/v1/tracks/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "program": "program-uuid",
    "name": "Network Security",
    "key": "network_security",
    "description": "Network security specialization",
    "director": "director-user-id"
  }'
```

### Cohorts

```bash
# List Cohorts
curl -X GET "http://localhost:8000/api/v1/cohorts/?track_id={track-id}&status=active" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# Create Cohort
curl -X POST http://localhost:8000/api/v1/cohorts/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "track": "track-uuid",
    "name": "Cohort 2024-01",
    "start_date": "2024-01-01",
    "end_date": "2024-06-30",
    "mode": "virtual",
    "seat_cap": 20,
    "mentor_ratio": 0.1,
    "status": "draft"
  }'
```

## Helper Script

Create a file `test_api.sh`:

```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:8000/api/v1"
EMAIL="director@example.com"
PASSWORD="yourpassword"

# Login and get token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed!"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "Token obtained: ${TOKEN:0:20}..."

# Use token for requests
echo -e "\nGetting programs..."
curl -X GET "$API_URL/programs/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '.'

echo -e "\nGetting director dashboard..."
curl -X GET "$API_URL/director/dashboard/summary/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '.'
```

Make it executable and run:
```bash
chmod +x test_api.sh
./test_api.sh
```

## Using jq for Pretty Output

Install jq for formatted JSON:
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

Then pipe curl output:
```bash
curl -X GET http://localhost:8000/api/v1/programs/ \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

## Common Errors

### 401 Unauthorized
- Token missing or expired
- Solution: Re-authenticate to get a new token

### 403 Forbidden
- User doesn't have permission
- Solution: Check user has director role or is staff

### 404 Not Found
- Resource doesn't exist or user can't access it
- Solution: Verify resource ID and user permissions

## Testing with Swagger UI

For easier testing, use Swagger UI:
1. Open http://localhost:8000/api/schema/swagger-ui/
2. Click "Authorize" button
3. Enter token: `Bearer <your-token>`
4. Test endpoints interactively

