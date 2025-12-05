# Fix: Authorization Header Error

## Problem

When using curl with `$TOKEN` variable, you get:
```json
{"detail":"Authorization header must contain two space-delimited values","code":"bad_authorization_header"}
```

This happens when `$TOKEN` is empty or not properly set.

## Solution

### Method 1: Extract Token Properly

```bash
# Step 1: Login and extract token correctly
LOGIN_RESPONSE=$(curl -s -X POST 'http://localhost:8000/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email": "your-email@example.com", "password": "yourpassword"}')

# Extract token using Python (most reliable)
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('access_token', ''))
except:
    print('')
")

# Verify token is not empty
if [ -z "$TOKEN" ]; then
    echo "ERROR: Token extraction failed!"
    echo "Login response: $LOGIN_RESPONSE"
    exit 1
fi

# Step 2: Use token (note: use double quotes around $TOKEN)
curl -X GET 'http://localhost:8000/api/v1/programs/' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json'
```

### Method 2: One-Liner with jq

If you have `jq` installed:

```bash
# Login and get token in one line
TOKEN=$(curl -s -X POST 'http://localhost:8000/api/v1/auth/login/' \
  -H 'Content-Type: application/json' \
  -d '{"email": "your-email@example.com", "password": "yourpassword"}' \
  | jq -r '.access_token')

# Use token
curl -X GET 'http://localhost:8000/api/v1/programs/' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json'
```

### Method 3: Manual Token (for testing)

```bash
# Get token manually first
curl -X POST 'http://localhost:8000/api/v1/auth/login/' \
  -H 'Content-Type: application/json' \
  -d '{"email": "your-email@example.com", "password": "yourpassword"}'

# Copy the access_token from response, then:
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."  # Paste your actual token here

# Use token
curl -X GET 'http://localhost:8000/api/v1/programs/' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json'
```

## Debugging Tips

### Check if TOKEN is set:
```bash
echo "Token value: '$TOKEN'"
echo "Token length: ${#TOKEN}"
```

### Test token extraction:
```bash
# Test login response
RESPONSE=$(curl -s -X POST 'http://localhost:8000/api/v1/auth/login/' \
  -H 'Content-Type: application/json' \
  -d '{"email": "your-email@example.com", "password": "yourpassword"}')

echo "Full response:"
echo "$RESPONSE" | python3 -m json.tool

# Extract token
TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")
echo "Extracted token: ${TOKEN:0:50}..."
```

### Common Issues

1. **Token variable not exported**: Use `export TOKEN=...` if using in different shell
2. **Token contains newlines**: Trim whitespace: `TOKEN=$(echo "$TOKEN" | tr -d '\n\r')`
3. **Wrong credentials**: Verify email/password are correct
4. **Token expired**: Tokens expire after 60 minutes, re-authenticate

## Complete Working Example

```bash
#!/bin/bash
set -e  # Exit on error

API_URL="http://localhost:8000/api/v1"
EMAIL="director@test.com"
PASSWORD="testpass123"

echo "Logging in as $EMAIL..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login/" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

# Check if login was successful
if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "✓ Login successful"
else
    echo "✗ Login failed:"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    token = data.get('access_token', '')
    if token:
        print(token)
    else:
        print('', file=sys.stderr)
        sys.exit(1)
except Exception as e:
    print('', file=sys.stderr)
    sys.exit(1)
")

if [ -z "$TOKEN" ]; then
    echo "✗ Failed to extract token"
    exit 1
fi

echo "✓ Token extracted (length: ${#TOKEN})"

# Test programs endpoint
echo -e "\nFetching programs..."
curl -X GET "$API_URL/programs/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  | python3 -m json.tool

echo -e "\n✓ Success!"
```

## Quick Test Script

Save this as `test_api.sh`:

```bash
#!/bin/bash
API_URL="http://localhost:8000/api/v1"

# Login
echo "Logging in..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"email": "director@test.com", "password": "testpass123"}')

# Extract token
TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$TOKEN" ]; then
    echo "Login failed: $RESPONSE"
    exit 1
fi

echo "Token: ${TOKEN:0:30}..."

# Test endpoints
echo -e "\n=== Programs ==="
curl -s -X GET "$API_URL/programs/" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -20

echo -e "\n=== Director Dashboard ==="
curl -s -X GET "$API_URL/director/dashboard/summary/" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Make executable and run:
```bash
chmod +x test_api.sh
./test_api.sh
```

