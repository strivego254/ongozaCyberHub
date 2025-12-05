# Debugging Authentication Issues

## Problem: 401 Unauthorized after successful login

If you're getting `401 Unauthorized` when accessing `/api/v1/programs/` after a successful login, check the following:

## Step-by-Step Debugging

### 1. Verify Login Response

```bash
# Test login and see full response
curl -v -X POST 'http://localhost:8000/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email": "your-email@example.com", "password": "yourpassword"}' \
  2>&1 | grep -A 50 "< HTTP"
```

**Expected response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {...},
  "consent_scopes": [...]
}
```

### 2. Extract Token Correctly

```bash
# Method 1: Using Python (most reliable)
LOGIN_RESPONSE=$(curl -s -X POST 'http://localhost:8000/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email": "your-email@example.com", "password": "yourpassword"}')

# Check if login was successful
echo "$LOGIN_RESPONSE" | python3 -m json.tool

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    token = data.get('access_token', '')
    if not token:
        print('ERROR: No access_token found', file=sys.stderr)
        print('Response keys:', list(data.keys()), file=sys.stderr)
        sys.exit(1)
    print(token)
except Exception as e:
    print('ERROR:', str(e), file=sys.stderr)
    sys.exit(1)
")

# Verify token is set
if [ -z "$TOKEN" ]; then
    echo "ERROR: Token extraction failed!"
    exit 1
fi

echo "Token extracted: ${TOKEN:0:50}..."
```

### 3. Test Token Usage

```bash
# Test with verbose output to see headers
curl -v -X GET 'http://localhost:8000/api/v1/programs/' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' \
  2>&1 | grep -E "(< HTTP|Authorization|Bearer)"
```

### 4. Common Issues

#### Issue 1: Token variable is empty
**Symptom:** `Authorization header must contain two space-delimited values`

**Fix:**
```bash
# Always verify token is set before using
if [ -z "$TOKEN" ]; then
    echo "ERROR: Token is empty!"
    exit 1
fi
```

#### Issue 2: Token contains newlines or extra spaces
**Symptom:** Token appears to be set but still 401

**Fix:**
```bash
# Trim whitespace
TOKEN=$(echo "$TOKEN" | tr -d '\n\r ' | xargs)
```

#### Issue 3: Token expired
**Symptom:** Token was valid but now returns 401

**Fix:** Tokens expire after 60 minutes. Re-authenticate:
```bash
# Get new token
TOKEN=$(curl -s -X POST 'http://localhost:8000/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email": "your-email@example.com", "password": "yourpassword"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")
```

#### Issue 4: User doesn't have permissions
**Symptom:** Token is valid but still 401

**Fix:** Check user permissions:
```bash
# Check user info
curl -X GET 'http://localhost:8000/api/v1/auth/me' \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool
```

### 5. Complete Working Example

```bash
#!/bin/bash
set -e  # Exit on error

API="http://localhost:8000/api/v1"
EMAIL="your-email@example.com"
PASSWORD="yourpassword"

echo "=== Step 1: Login ==="
LOGIN_RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

# Check for errors
if echo "$LOGIN_RESP" | grep -q '"detail"'; then
    echo "Login failed:"
    echo "$LOGIN_RESP" | python3 -m json.tool
    exit 1
fi

echo "✓ Login successful"

# Extract token
TOKEN=$(echo "$LOGIN_RESP" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('access_token', ''))
except:
    print('', file=sys.stderr)
    sys.exit(1)
")

if [ -z "$TOKEN" ]; then
    echo "✗ Failed to extract token"
    echo "Response: $LOGIN_RESP"
    exit 1
fi

echo "✓ Token extracted (length: ${#TOKEN})"

# Trim token (remove any whitespace)
TOKEN=$(echo "$TOKEN" | tr -d '\n\r ')

echo -e "\n=== Step 2: Test Programs Endpoint ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$API/programs/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ Success!"
    echo "$BODY" | python3 -m json.tool | head -20
else
    echo "✗ Failed with status: $HTTP_STATUS"
    echo "Response:"
    echo "$BODY"
fi
```

## Testing with Real User

### Create a test user (if needed)

```bash
cd backend/django_app
source venv/bin/activate
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
User = get_user_model()

# Create test director user
user = User.objects.create_user(
    email='director@test.com',
    password='testpass123',
    first_name='Test',
    last_name='Director',
    account_status='active'
)
print(f"Created user: {user.email}")
```

### Test with that user

```bash
# Use the test credentials
EMAIL="director@test.com"
PASSWORD="testpass123"

# Run the test script above
```

## Verify Token Format

A valid JWT token should:
- Start with `eyJ`
- Have 3 parts separated by dots: `header.payload.signature`
- Be quite long (usually 200+ characters)

```bash
# Check token format
echo "$TOKEN" | cut -d. -f1 | base64 -d 2>/dev/null | python3 -m json.tool
```

## Check Django Logs

If still having issues, check Django server logs for:
- Authentication errors
- Permission denied messages
- Token validation errors

```bash
# In Django server terminal, look for:
# - "Invalid token"
# - "Authentication credentials were not provided"
# - "You do not have permission"
```

