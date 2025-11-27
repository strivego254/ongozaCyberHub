#!/bin/bash

# API Testing Script for Ongoza CyberHub
# Modular role-based endpoint testing
# Usage: 
#   ./scripts/test_endpoints.sh [role] [base_url]
#   Roles: admin, student, mentor, director, all, common
#   Example: ./scripts/test_endpoints.sh admin
#   Example: ./scripts/test_endpoints.sh all http://localhost:8000/api/v1

ROLE=${1:-all}
BASE_URL=${2:-http://localhost:8000/api/v1}
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test user credentials
declare -A TEST_USERS=(
    [admin]="admin@test.com"
    [student]="student@test.com"
    [mentor]="mentor@test.com"
    [director]="director@test.com"
)
PASSWORD="testpass123"

# Check if jq is available
if command -v jq &> /dev/null; then
    HAS_JQ=true
else
    HAS_JQ=false
    echo -e "${YELLOW}Note: jq not found. Using basic JSON parsing. Install jq for better output.${NC}\n"
fi

# Helper function to extract JSON value
extract_json_value() {
    local json="$1"
    local key="$2"
    
    if [ -z "$json" ] || [ "$json" = "" ]; then
        echo ""
        return
    fi
    
    if [ "$HAS_JQ" = true ]; then
        echo "$json" | jq -r ".$key // empty" 2>/dev/null || echo ""
    else
        # Try Python first (usually available)
        if command -v python3 &> /dev/null; then
            echo "$json" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('$key', '') or '')" 2>/dev/null | grep -v "^$" || echo ""
        elif command -v python &> /dev/null; then
            echo "$json" | python -c "import sys, json; data = json.load(sys.stdin); print(data.get('$key', '') or '')" 2>/dev/null | grep -v "^$" || echo ""
        else
            # Fallback: basic extraction using grep/sed
            echo "$json" | grep -o "\"$key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | sed "s/\"$key\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\"/\1/" | head -1
        fi
    fi
}

# Helper function to pretty print JSON
pretty_json() {
    local json="$1"
    
    if [ "$HAS_JQ" = true ]; then
        echo "$json" | jq '.'
    else
        echo "$json"
    fi
}

# Helper function to make API call and handle errors
api_call() {
    local method="$1"
    local url="$2"
    local headers="$3"
    local data="$4"
    local description="$5"
    
    local response
    local status_code
    local http_code
    local curl_cmd
    
    # Build curl command
    if [ -z "$data" ] || [ "$data" = "" ]; then
        curl_cmd="curl -s -w \"\n%{http_code}\" -X \"$method\" \"$url\" $headers"
    else
        curl_cmd="curl -s -w \"\n%{http_code}\" -X \"$method\" \"$url\" $headers -d '$data'"
    fi
    
    response=$(eval $curl_cmd)
    http_code=$(echo "$response" | tail -n1)
    response=$(echo "$response" | sed '$d')
    
    status_code=$http_code
    
    # Handle different HTTP status codes
    case "$status_code" in
        200|201)
            echo "$response"
            return 0
            ;;
        301|302)
            echo -e "${RED}Error: Redirect ($status_code)${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} URL may be missing trailing slash or endpoint moved." >&2
            echo -e "${YELLOW}Fix:${NC} Try adding trailing slash: ${url%/}/" >&2
            echo "$response"
            return 1
            ;;
        400)
            echo -e "${RED}Error: Bad Request ($status_code)${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} Invalid request data or malformed JSON." >&2
            local error_detail=$(extract_json_value "$response" "detail")
            local error_message=$(extract_json_value "$response" "message")
            if [ ! -z "$error_detail" ]; then
                echo -e "${YELLOW}Detail:${NC} $error_detail" >&2
            elif [ ! -z "$error_message" ]; then
                echo -e "${YELLOW}Message:${NC} $error_message" >&2
            fi
            echo "$response"
            return 1
            ;;
        401)
            echo -e "${RED}Error: Unauthorized ($status_code)${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} Authentication required or token invalid/expired." >&2
            local error_detail=$(extract_json_value "$response" "detail")
            if [ ! -z "$error_detail" ]; then
                echo -e "${YELLOW}Detail:${NC} $error_detail" >&2
            fi
            echo "$response"
            return 1
            ;;
        403)
            echo -e "${RED}Error: Forbidden ($status_code)${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} User doesn't have permission for this action." >&2
            local error_detail=$(extract_json_value "$response" "detail")
            if [ ! -z "$error_detail" ]; then
                echo -e "${YELLOW}Detail:${NC} $error_detail" >&2
            fi
            echo "$response"
            return 1
            ;;
        404)
            echo -e "${RED}Error: Not Found ($status_code)${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} Endpoint or resource doesn't exist." >&2
            echo "$response"
            return 1
            ;;
        500)
            echo -e "${RED}Error: Internal Server Error ($status_code)${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} Server-side error occurred." >&2
            local error_detail=$(extract_json_value "$response" "detail")
            if [ ! -z "$error_detail" ]; then
                echo -e "${YELLOW}Detail:${NC} $error_detail" >&2
            fi
            echo "$response"
            return 1
            ;;
        0|000)
            echo -e "${RED}Error: Connection Failed${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} Cannot connect to server." >&2
            echo "$response"
            return 1
            ;;
        *)
            echo -e "${RED}Error: HTTP $status_code${NC}" >&2
            echo "$response"
            return 1
            ;;
    esac
}

# Helper to extract error messages from response
extract_error_message() {
    local response="$1"
    
    local detail=$(extract_json_value "$response" "detail")
    local message=$(extract_json_value "$response" "message")
    local error=$(extract_json_value "$response" "error")
    
    if [ ! -z "$detail" ] && [ "$detail" != "" ]; then
        echo "$detail"
    elif [ ! -z "$message" ] && [ "$message" != "" ]; then
        echo "$message"
    elif [ ! -z "$error" ] && [ "$error" != "" ]; then
        echo "$error"
    else
        echo ""
    fi
}

# Helper to login and get token
login_user() {
    local email="$1"
    local password="$2"
    local role="$3"
    
    echo -e "${CYAN}Logging in as $role ($email)...${NC}" >&2
    # Capture only stdout (response), stderr (errors) goes to terminal
    local login_response=$(api_call "POST" "$BASE_URL/auth/login" \
        "-H \"Content-Type: application/json\"" \
        "{\"email\":\"$email\",\"password\":\"$password\",\"device_fingerprint\":\"test-device\"}" \
        "$role login" 2>/dev/null)
    
    local login_status=$?
    if [ $login_status -ne 0 ]; then
        local error_msg=$(extract_error_message "$login_response")
        echo -e "${RED}Login failed for $role${NC}" >&2
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg" >&2
        fi
        echo "" >&2
        return 1
    fi
    
    # Extract token from response
    local token=$(extract_json_value "$login_response" "access_token")
    if [ -z "$token" ] || [ "$token" = "" ]; then
        echo -e "${RED}Failed to extract access token for $role${NC}" >&2
        echo -e "${YELLOW}Debug - Response preview:${NC}" >&2
        echo "$login_response" | head -3 >&2
        return 1
    fi
    
    # Only output token to stdout (for capture), everything else to stderr
    echo "$token"
    return 0
}

# Test common endpoints (available to all authenticated users)
test_common_endpoints() {
    local token="$1"
    local role="$2"
    
    echo -e "${BLUE}=== Testing Common Endpoints ($role) ===${NC}\n"
    
    # Validate token before making requests
    if [ -z "$token" ] || [ "$token" = "" ]; then
        echo -e "${RED}Error: No token provided for $role${NC}\n" >&2
        return 1
    fi
    
    # Get current user profile
    echo -e "${YELLOW}1. Get current user profile (/auth/me)${NC}"
    local response=$(api_call "GET" "$BASE_URL/auth/me" \
        "-H \"Authorization: Bearer $token\"" \
        "" \
        "get current user")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    # List roles
    echo -e "${YELLOW}2. List available roles (/roles/)${NC}"
    response=$(api_call "GET" "$BASE_URL/roles/" \
        "-H \"Authorization: Bearer $token\"" \
        "" \
        "list roles")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    # List organizations (user's orgs)
    echo -e "${YELLOW}3. List organizations (/orgs/)${NC}"
    response=$(api_call "GET" "$BASE_URL/orgs/" \
        "-H \"Authorization: Bearer $token\"" \
        "" \
        "list organizations")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    echo ""
}

# Test Admin endpoints
test_admin_endpoints() {
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ADMIN ENDPOINT TESTS                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}\n"
    
    local admin_token=$(login_user "${TEST_USERS[admin]}" "$PASSWORD" "admin")
    local login_result=$?
    
    if [ $login_result -ne 0 ] || [ -z "$admin_token" ] || [ "$admin_token" = "" ]; then
        echo -e "${RED}Failed to authenticate admin user. Skipping admin tests.${NC}\n"
        return 1
    fi
    
    echo -e "${GREEN}✓ Admin authenticated (token: ${admin_token:0:20}...)${NC}\n"
    
    # Common endpoints
    test_common_endpoints "$admin_token" "admin"
    
    # Admin-specific: List all users
    echo -e "${YELLOW}4. List all users (/users/) - Admin only${NC}"
    local response=$(api_call "GET" "$BASE_URL/users/" \
        "-H \"Authorization: Bearer $admin_token\"" \
        "" \
        "list all users")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    # Admin-specific: List audit logs
    echo -e "${YELLOW}5. List audit logs (/audit-logs/) - Admin only${NC}"
    response=$(api_call "GET" "$BASE_URL/audit-logs/" \
        "-H \"Authorization: Bearer $admin_token\"" \
        "" \
        "list audit logs")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    # Admin-specific: Get audit statistics
    echo -e "${YELLOW}6. Get audit statistics (/audit-logs/stats/) - Admin only${NC}"
    response=$(api_call "GET" "$BASE_URL/audit-logs/stats/" \
        "-H \"Authorization: Bearer $admin_token\"" \
        "" \
        "get audit statistics")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    # Admin-specific: Create organization
    echo -e "${YELLOW}7. Create organization (/orgs/) - Admin only${NC}"
    local org_slug="test-org-$(date +%s)"
    response=$(api_call "POST" "$BASE_URL/orgs/" \
        "-H \"Authorization: Bearer $admin_token\" -H \"Content-Type: application/json\"" \
        "{\"name\":\"Test Organization\",\"slug\":\"$org_slug\",\"org_type\":\"sponsor\"}" \
        "create organization")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    # Admin-specific: Assign role to user
    echo -e "${YELLOW}8. Assign role to user (/users/{id}/roles) - Admin only${NC}"
    # First get a student user ID
    local student_token=$(login_user "${TEST_USERS[student]}" "$PASSWORD" "student")
    if [ $? -eq 0 ]; then
        local student_me=$(api_call "GET" "$BASE_URL/auth/me" \
            "-H \"Authorization: Bearer $student_token\"" \
            "" \
            "get student profile")
        local student_id=$(extract_json_value "$student_me" "id")
        
        if [ ! -z "$student_id" ] && [ "$student_id" != "" ]; then
            echo "Assigning mentor role to student (ID: $student_id)..."
            response=$(api_call "POST" "$BASE_URL/users/$student_id/roles" \
                "-H \"Authorization: Bearer $admin_token\" -H \"Content-Type: application/json\"" \
                "{\"role_id\":2,\"scope\":\"global\"}" \
                "assign role")
            if [ $? -eq 0 ]; then
                pretty_json "$response"
                echo -e "${GREEN}✓ Success${NC}\n"
            else
                local error_msg=$(extract_error_message "$response")
                if [ ! -z "$error_msg" ]; then
                    echo -e "${RED}Error:${NC} $error_msg\n" >&2
                fi
            fi
        fi
    fi
    
    # Admin-specific: Create API key
    echo -e "${YELLOW}9. Create API key (/api-keys) - Admin only${NC}"
    response=$(api_call "POST" "$BASE_URL/api-keys" \
        "-H \"Authorization: Bearer $admin_token\" -H \"Content-Type: application/json\"" \
        "{\"name\":\"Test API Key\",\"key_type\":\"service\"}" \
        "create API key")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    echo -e "${GREEN}=== Admin Tests Complete ===${NC}\n"
}

# Test Student endpoints
test_student_endpoints() {
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   STUDENT ENDPOINT TESTS               ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}\n"
    
    local student_token=$(login_user "${TEST_USERS[student]}" "$PASSWORD" "student")
    local login_result=$?
    
    if [ $login_result -ne 0 ] || [ -z "$student_token" ] || [ "$student_token" = "" ]; then
        echo -e "${RED}Failed to authenticate student user. Skipping student tests.${NC}\n"
        return 1
    fi
    
    echo -e "${GREEN}✓ Student authenticated (token: ${student_token:0:20}...)${NC}\n"
    
    # Common endpoints
    test_common_endpoints "$student_token" "student"
    
    # Student-specific: Try to access users endpoint (should fail or be limited)
    echo -e "${YELLOW}4. Attempt to list all users (/users/) - Should be restricted${NC}"
    local response=$(api_call "GET" "$BASE_URL/users/" \
        "-H \"Authorization: Bearer $student_token\"" \
        "" \
        "list users as student")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${YELLOW}Note: Student has access (may be limited to own profile)${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${YELLOW}Expected:${NC} Student access restricted - $error_msg\n"
        fi
    fi
    
    # Student-specific: Try to access audit logs (should fail)
    echo -e "${YELLOW}5. Attempt to access audit logs (/audit-logs/) - Should be restricted${NC}"
    response=$(api_call "GET" "$BASE_URL/audit-logs/" \
        "-H \"Authorization: Bearer $student_token\"" \
        "" \
        "access audit logs as student")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${YELLOW}Note: Student has unexpected access to audit logs${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${YELLOW}Expected:${NC} Student access restricted - $error_msg\n"
        fi
    fi
    
    # Student-specific: List progress
    echo -e "${YELLOW}6. List progress (/progress/) - Student access${NC}"
    response=$(api_call "GET" "$BASE_URL/progress/" \
        "-H \"Authorization: Bearer $student_token\"" \
        "" \
        "list progress")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    echo -e "${GREEN}=== Student Tests Complete ===${NC}\n"
}

# Test Mentor endpoints
test_mentor_endpoints() {
    echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║   MENTOR ENDPOINT TESTS                ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}\n"
    
    local mentor_token=$(login_user "${TEST_USERS[mentor]}" "$PASSWORD" "mentor")
    local login_result=$?
    
    if [ $login_result -ne 0 ] || [ -z "$mentor_token" ] || [ "$mentor_token" = "" ]; then
        echo -e "${RED}Failed to authenticate mentor user. Skipping mentor tests.${NC}\n"
        return 1
    fi
    
    echo -e "${GREEN}✓ Mentor authenticated (token: ${mentor_token:0:20}...)${NC}\n"
    
    # Common endpoints
    test_common_endpoints "$mentor_token" "mentor"
    
    # Mentor-specific: List assigned students/mentees
    echo -e "${YELLOW}4. List assigned students (/users/?role=student) - Mentor access${NC}"
    local response=$(api_call "GET" "$BASE_URL/users/?role=student" \
        "-H \"Authorization: Bearer $mentor_token\"" \
        "" \
        "list students")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    # Mentor-specific: View student progress
    echo -e "${YELLOW}5. View student progress (/progress/) - Mentor access${NC}"
    response=$(api_call "GET" "$BASE_URL/progress/" \
        "-H \"Authorization: Bearer $mentor_token\"" \
        "" \
        "view student progress")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    # Mentor-specific: Create organization (if allowed)
    echo -e "${YELLOW}6. Create organization (/orgs/) - Mentor access${NC}"
    local org_slug="mentor-org-$(date +%s)"
    response=$(api_call "POST" "$BASE_URL/orgs/" \
        "-H \"Authorization: Bearer $mentor_token\" -H \"Content-Type: application/json\"" \
        "{\"name\":\"Mentor Organization\",\"slug\":\"$org_slug\",\"org_type\":\"partner\"}" \
        "create organization")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${YELLOW}Note:${NC} Mentor may not have permission - $error_msg\n"
        fi
    fi
    
    echo -e "${GREEN}=== Mentor Tests Complete ===${NC}\n"
}

# Test Program Director endpoints
test_director_endpoints() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   PROGRAM DIRECTOR ENDPOINT TESTS      ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"
    
    local director_token=$(login_user "${TEST_USERS[director]}" "$PASSWORD" "director")
    local login_result=$?
    
    if [ $login_result -ne 0 ] || [ -z "$director_token" ] || [ "$director_token" = "" ]; then
        echo -e "${RED}Failed to authenticate director user. Skipping director tests.${NC}\n"
        return 1
    fi
    
    echo -e "${GREEN}✓ Program Director authenticated (token: ${director_token:0:20}...)${NC}\n"
    
    # Common endpoints
    test_common_endpoints "$director_token" "director"
    
    # Director-specific: List all users in program
    echo -e "${YELLOW}4. List program users (/users/) - Director access${NC}"
    local response=$(api_call "GET" "$BASE_URL/users/" \
        "-H \"Authorization: Bearer $director_token\"" \
        "" \
        "list program users")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    # Director-specific: Manage organizations
    echo -e "${YELLOW}5. Create organization (/orgs/) - Director access${NC}"
    local org_slug="director-org-$(date +%s)"
    response=$(api_call "POST" "$BASE_URL/orgs/" \
        "-H \"Authorization: Bearer $director_token\" -H \"Content-Type: application/json\"" \
        "{\"name\":\"Program Organization\",\"slug\":\"$org_slug\",\"org_type\":\"sponsor\"}" \
        "create organization")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    # Director-specific: View all progress
    echo -e "${YELLOW}6. View all progress (/progress/) - Director access${NC}"
    response=$(api_call "GET" "$BASE_URL/progress/" \
        "-H \"Authorization: Bearer $director_token\"" \
        "" \
        "view all progress")
    if [ $? -eq 0 ]; then
        pretty_json "$response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    # Director-specific: Assign roles (if allowed)
    echo -e "${YELLOW}7. Assign role to user (/users/{id}/roles) - Director access${NC}"
    local student_token=$(login_user "${TEST_USERS[student]}" "$PASSWORD" "student")
    if [ $? -eq 0 ]; then
        local student_me=$(api_call "GET" "$BASE_URL/auth/me" \
            "-H \"Authorization: Bearer $student_token\"" \
            "" \
            "get student profile")
        local student_id=$(extract_json_value "$student_me" "id")
        
        if [ ! -z "$student_id" ] && [ "$student_id" != "" ]; then
            echo "Assigning role to student (ID: $student_id)..."
            response=$(api_call "POST" "$BASE_URL/users/$student_id/roles" \
                "-H \"Authorization: Bearer $director_token\" -H \"Content-Type: application/json\"" \
                "{\"role_id\":1,\"scope\":\"cohort\"}" \
                "assign role")
            if [ $? -eq 0 ]; then
                pretty_json "$response"
                echo -e "${GREEN}✓ Success${NC}\n"
            else
                local error_msg=$(extract_error_message "$response")
                if [ ! -z "$error_msg" ]; then
                    echo -e "${YELLOW}Note:${NC} Director may not have permission - $error_msg\n"
                fi
            fi
        fi
    fi
    
    echo -e "${GREEN}=== Program Director Tests Complete ===${NC}\n"
}

# Test authentication endpoints (no auth required)
test_auth_endpoints() {
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   AUTHENTICATION ENDPOINT TESTS        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}\n"
    
    # Test signup
    echo -e "${YELLOW}1. Test signup (/auth/signup)${NC}"
    local signup_response=$(api_call "POST" "$BASE_URL/auth/signup" \
        "-H \"Content-Type: application/json\"" \
        "{\"email\":\"test$(date +%s)@example.com\",\"password\":\"TestPass123!\",\"first_name\":\"Test\",\"last_name\":\"User\"}" \
        "signup")
    if [ $? -eq 0 ]; then
        pretty_json "$signup_response"
        echo -e "${GREEN}✓ Success${NC}\n"
    else
        local error_msg=$(extract_error_message "$signup_response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    # Test login
    echo -e "${YELLOW}2. Test login (/auth/login)${NC}"
    local login_response=$(api_call "POST" "$BASE_URL/auth/login" \
        "-H \"Content-Type: application/json\"" \
        "{\"email\":\"${TEST_USERS[student]}\",\"password\":\"$PASSWORD\",\"device_fingerprint\":\"test-device\"}" \
        "login")
    if [ $? -eq 0 ]; then
        pretty_json "$login_response"
        local token=$(extract_json_value "$login_response" "access_token")
        if [ ! -z "$token" ]; then
            echo -e "${GREEN}✓ Login successful${NC}\n"
        fi
    else
        local error_msg=$(extract_error_message "$login_response")
        if [ ! -z "$error_msg" ]; then
            echo -e "${RED}Error:${NC} $error_msg\n" >&2
        fi
    fi
    
    echo -e "${GREEN}=== Authentication Tests Complete ===${NC}\n"
}

# Main function
main() {
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   Ongoza CyberHub API Endpoint Testing                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}\n"
    
    echo "Base URL: $BASE_URL"
    echo "Testing role: $ROLE"
    echo ""
    
    # Check if server is reachable
    if ! curl -s -f "$BASE_URL/../health/" > /dev/null 2>&1 && ! curl -s -f "$BASE_URL/roles" > /dev/null 2>&1; then
        echo -e "${YELLOW}Warning: Server may not be running at $BASE_URL${NC}"
        echo -e "${YELLOW}Start server with: python manage.py runserver${NC}\n"
    fi
    echo ""
    
    case "$ROLE" in
        admin)
            test_auth_endpoints
            test_admin_endpoints
            ;;
        student)
            test_auth_endpoints
            test_student_endpoints
            ;;
        mentor)
            test_auth_endpoints
            test_mentor_endpoints
            ;;
        director)
            test_auth_endpoints
            test_director_endpoints
            ;;
        common)
            test_auth_endpoints
            local token=$(login_user "${TEST_USERS[student]}" "$PASSWORD" "student")
            local login_result=$?
            if [ $login_result -eq 0 ] && [ ! -z "$token" ] && [ "$token" != "" ]; then
                test_common_endpoints "$token" "student"
            else
                echo -e "${RED}Failed to authenticate student for common endpoint tests.${NC}\n"
            fi
            ;;
        all)
            test_auth_endpoints
            test_admin_endpoints
            test_student_endpoints
            test_mentor_endpoints
            test_director_endpoints
            ;;
        *)
            echo -e "${RED}Invalid role: $ROLE${NC}"
            echo "Usage: $0 [role] [base_url]"
            echo "Roles: admin, student, mentor, director, common, all"
            echo "Example: $0 admin"
            echo "Example: $0 all http://localhost:8000/api/v1"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   All Tests Complete                                    ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}\n"
    
    echo "Test users (password: $PASSWORD):"
    echo "  - ${TEST_USERS[admin]} (Admin)"
    echo "  - ${TEST_USERS[student]} (Student)"
    echo "  - ${TEST_USERS[mentor]} (Mentor)"
    echo "  - ${TEST_USERS[director]} (Program Director)"
    echo ""
}

# Run main function
main
