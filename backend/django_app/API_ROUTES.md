# API Routes Documentation

## Authentication Endpoints (prefix: `/api/v1/auth`)

### POST /signup
Create account (invite optional).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "country": "BW",
  "timezone": "Africa/Gaborone",
  "language": "en",
  "cohort_id": "optional-cohort-id",
  "track_key": "optional-track-key"
}
```

**Response:** `201 Created`
```json
{
  "detail": "Account created. Please verify your email.",
  "user_id": "uuid"
}
```

### POST /login
Login with password or code (passwordless).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "device_fingerprint": "device-id",
  "device_name": "Chrome on Windows"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "jwt-token",
  "refresh_token": "refresh-token",
  "user": {...},
  "consent_scopes": [...]
}
```

### POST /login/magic-link
Send magic link for passwordless login.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "detail": "Magic link sent to your email"
}
```

### POST /mfa/enroll
Enroll in MFA (TOTP setup).

**Request:**
```json
{
  "method": "totp",
  "phone_number": "optional-for-sms"
}
```

**Response:** `201 Created`
```json
{
  "mfa_method_id": "uuid",
  "secret": "base32-secret",
  "qr_code_uri": "otpauth://totp/..."
}
```

### POST /mfa/verify
Verify MFA code.

**Request:**
```json
{
  "code": "123456",
  "method": "totp"
}
```

**Response:** `200 OK`
```json
{
  "detail": "MFA verified successfully",
  "backup_codes": ["code1", "code2", ...]  // Only on enrollment
}
```

### POST /mfa/disable
Disable MFA for user.

**Request:** (empty body)

**Response:** `200 OK`
```json
{
  "detail": "MFA disabled successfully"
}
```

### POST /token/refresh
Rotate refresh token.

**Request:**
```json
{
  "refresh_token": "refresh-token",
  "device_fingerprint": "device-id"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "new-jwt-token",
  "refresh_token": "new-refresh-token"
}
```

### POST /logout
Revoke session.

**Request:**
```json
{
  "refresh_token": "refresh-token"  // Optional
}
```

**Response:** `200 OK`
```json
{
  "detail": "Logged out successfully"
}
```

### GET /me
Get current user profile with roles and consents.

**Response:** `200 OK`
```json
{
  "user": {
    "id": "UUID",
    "email": "martin@och.africa",
    "name": "Martin"
  },
  "roles": [
    {
      "role": "program_director",
      "scope": "cohort",
      "scope_ref": "UUID-COHORT-JAN26"
    }
  ],
  "consent_scopes": [
    "share_with_mentor",
    "public_portfolio:false"
  ],
  "entitlements": [
    "cohort_seat:JAN26",
    "module_access:profiling"
  ]
}
```

### POST /consents
Update consent scopes.

**Request:**
```json
{
  "scope_type": "share_with_mentor",
  "granted": true,
  "expires_at": "2025-12-31T23:59:59Z"  // Optional
}
```

**Response:** `200 OK`
```json
{
  "detail": "Consent share_with_mentor granted",
  "consent": {
    "scope_type": "share_with_mentor",
    "granted": true
  }
}
```

### POST /password/reset/request
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "detail": "Password reset email sent"
}
```

### POST /password/reset/confirm
Confirm password reset.

**Request:**
```json
{
  "token": "reset-token",
  "new_password": "NewSecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "detail": "Password reset successfully"
}
```

## Admin/Organization Endpoints

### GET /roles
List all roles.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "admin",
    "display_name": "Administrator",
    "description": "...",
    "role_type": "admin",
    "is_system": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### POST /roles
Create a new role (admin only).

**Request:**
```json
{
  "name": "custom_role",
  "display_name": "Custom Role",
  "description": "Custom role description",
  "role_type": "student"
}
```

**Response:** `201 Created`
```json
{
  "id": 10,
  "name": "custom_role",
  "display_name": "Custom Role",
  ...
}
```

### POST /users/{id}/roles
Assign role to user with scope.

**Request:**
```json
{
  "role_id": 2,
  "scope": "global",
  "scope_ref": "optional-reference-id"
}
```

**Response:** `201 Created`
```json
{
  "detail": "Role assigned successfully",
  "user_role": {
    "id": 1,
    "role": "mentor",
    "scope": "global",
    "scope_ref": null
  }
}
```

### DELETE /users/{id}/roles/{role_id}
Revoke role from user.

**Response:** `200 OK`
```json
{
  "detail": "Role revoked successfully"
}
```

### POST /orgs
Create organization.

**Request:**
```json
{
  "name": "Test Organization",
  "slug": "test-org",
  "org_type": "sponsor",
  "description": "Optional description"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "Test Organization",
  "slug": "test-org",
  ...
}
```

### GET /orgs
List organizations (filtered by user membership).

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Test Organization",
    "slug": "test-org",
    ...
  }
]
```

### POST /orgs/{slug}/members
Add member to organization.

**Request:**
```json
{
  "user_id": 5,
  "role_id": 2
}
```

**Response:** `201 Created`
```json
{
  "detail": "Member added successfully"
}
```

### POST /api-keys
Create API key.

**Request:**
```json
{
  "name": "My API Key",
  "key_type": "service",
  "scopes": ["read", "write"]
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "My API Key",
  "key_prefix": "och_",
  "key": "och_xxxxxxxxxxxxx",
  "detail": "Store this key securely. It will not be shown again."
}
```

### DELETE /api-keys/{id}
Revoke API key.

**Response:** `200 OK`
```json
{
  "detail": "API key revoked successfully"
}
```

### GET /audit
List audit logs with filtering.

**Query Parameters:**
- `actor` - Filter by actor identifier (email, etc.)
- `entity` - Filter by resource type or resource ID
- `range` - Time range: `today`, `week`, `month`, `year`
- `start_date` - Start date (ISO format)
- `end_date` - End date (ISO format)
- `action` - Filter by action type
- `resource_type` - Filter by resource type
- `result` - Filter by result (`success`, `failure`, `partial`)

**Example:**
```
GET /api/v1/audit?actor=user@example.com&entity=user&range=week
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "actor_type": "user",
    "actor_identifier": "user@example.com",
    "action": "login",
    "resource_type": "user",
    "resource_id": "123",
    "timestamp": "2025-11-27T10:00:00Z",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "metadata": {},
    "result": "success"
  }
]
```

### GET /audit-logs/stats
Get audit log statistics.

**Response:** `200 OK`
```json
{
  "total": 1000,
  "success": 950,
  "failure": 50,
  "action_counts": {
    "login": 500,
    "logout": 300,
    "create": 200
  }
}
```

## OpenID Connect Endpoints

### GET /.well-known/openid-configuration
OIDC discovery endpoint.

**Response:** `200 OK`
```json
{
  "issuer": "https://api.example.com",
  "authorization_endpoint": "https://api.example.com/api/v1/oauth/authorize",
  "token_endpoint": "https://api.example.com/api/v1/oauth/token",
  "userinfo_endpoint": "https://api.example.com/api/v1/oauth/userinfo",
  "jwks_uri": "https://api.example.com/api/v1/.well-known/jwks.json",
  "response_types_supported": ["code", "id_token", "token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256", "HS256"],
  "scopes_supported": ["openid", "profile", "email", "offline_access"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
  "claims_supported": [...]
}
```

### GET /.well-known/jwks.json
JSON Web Key Set for token verification.

**Response:** `200 OK`
```json
{
  "keys": [...]
}
```

### POST /oauth/authorize
OAuth2 authorization endpoint (Authorization Code flow).

**Status:** Not yet implemented (returns 501)

### POST /oauth/token
OAuth2 token endpoint (Authorization Code, Client Credentials).

**Status:** Not yet implemented (returns 501)

### GET /oauth/userinfo
OIDC userinfo endpoint.

**Status:** Not yet implemented (returns 501)

### POST /oauth/introspect
OAuth2 token introspection endpoint (RFC 7662). Service-to-service token validation.

**Request:**
```json
{
  "token": "access-token",
  "token_type_hint": "access_token"
}
```

**Response:** `200 OK`
```json
{
  "active": true,
  "scope": "read write",
  "client_id": "client-id",
  "username": "user@example.com",
  "exp": 1234567890,
  "iat": 1234567890,
  "sub": "user-uuid",
  "aud": "audience",
  "iss": "issuer"
}
```

## Webhook Signatures

Webhook deliveries are signed using HMAC-SHA256 with per-consumer secrets. The signature includes:
- Timestamp header
- Replay window (5 minutes)
- HMAC-SHA256 signature of request body

**Example Header:**
```
X-Webhook-Signature: t=1234567890,v1=abc123...
```

## Error Responses

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "detail": "Error message",
  "field_name": ["Field-specific error"]
}
```

**401 Unauthorized:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found:**
```json
{
  "detail": "Not found."
}
```

**500 Internal Server Error:**
```json
{
  "detail": "A server error occurred."
}
```






