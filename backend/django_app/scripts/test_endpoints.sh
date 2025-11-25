#!/bin/bash

# API Testing Script for Ongoza CyberHub
# Usage: ./scripts/test_endpoints.sh [base_url]

BASE_URL=${1:-http://localhost:8000/api/v1}
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Ongoza CyberHub API Testing ===${NC}\n"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
curl -s "$BASE_URL/../health/" | jq '.' || echo "Health check failed"
echo ""

# Test 2: Signup
echo -e "${YELLOW}2. Testing Signup...${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "SecurePass123!",
    "first_name": "Test",
    "last_name": "User",
    "country": "BW",
    "timezone": "Africa/Gaborone"
  }')
echo "$SIGNUP_RESPONSE" | jq '.' || echo "$SIGNUP_RESPONSE"
USER_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.user_id // empty')
echo ""

# Test 3: Login
echo -e "${YELLOW}3. Testing Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "device_fingerprint": "test-device"
  }')
echo "$LOGIN_RESPONSE" | jq '.' || echo "$LOGIN_RESPONSE"

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.refresh_token // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}Login failed. Please create a user first.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo ""

# Test 4: Get Current User
echo -e "${YELLOW}4. Testing Get Current User...${NC}"
curl -s "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.' || echo "Failed"
echo ""

# Test 5: List Roles
echo -e "${YELLOW}5. Testing List Roles...${NC}"
curl -s "$BASE_URL/roles" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.' || echo "Failed"
echo ""

# Test 6: List Organizations
echo -e "${YELLOW}6. Testing List Organizations...${NC}"
curl -s "$BASE_URL/orgs" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.' || echo "Failed"
echo ""

# Test 7: List Audit Logs
echo -e "${YELLOW}7. Testing List Audit Logs...${NC}"
curl -s "$BASE_URL/audit-logs" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.' || echo "Failed"
echo ""

# Test 8: Refresh Token
echo -e "${YELLOW}8. Testing Refresh Token...${NC}"
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/token/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}")
echo "$REFRESH_RESPONSE" | jq '.' || echo "$REFRESH_RESPONSE"
NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.access_token // empty')
if [ ! -z "$NEW_ACCESS_TOKEN" ]; then
  ACCESS_TOKEN=$NEW_ACCESS_TOKEN
  echo -e "${GREEN}✓ Token refreshed${NC}"
fi
echo ""

# Test 9: OIDC Discovery
echo -e "${YELLOW}9. Testing OIDC Discovery...${NC}"
curl -s "http://localhost:8000/.well-known/openid-configuration" | jq '.' || echo "Failed"
echo ""

echo -e "${GREEN}=== Testing Complete ===${NC}"
echo ""
echo "Access Token: ${ACCESS_TOKEN:0:50}..."
echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
echo ""
echo "To test more endpoints, use:"
echo "  export ACCESS_TOKEN=\"$ACCESS_TOKEN\""
echo "  export REFRESH_TOKEN=\"$REFRESH_TOKEN\""
echo ""
echo "Then run individual curl commands from SETUP_AND_TESTING.md"

