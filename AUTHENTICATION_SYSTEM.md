# Authentication & Authorization System Documentation

## Overview

Comprehensive authentication and authorization system for Ongoza CyberHub implementing the full specification with SSO, MFA, consent management, API keys, and audit logging.

## Table of Contents

1. [Architecture](#architecture)
2. [Authentication Methods](#authentication-methods)
3. [SSO Providers](#sso-providers)
4. [Sessions & Tokens](#sessions--tokens)
5. [Organizations & Tenancy](#organizations--tenancy)
6. [API Keys & Service Accounts](#api-keys--service-accounts)
7. [Consent & Privacy](#consent--privacy)
8. [Audit & Security](#audit--security)
9. [User Interface](#user-interface)
10. [Setup & Configuration](#setup--configuration)

## Architecture

### Core Components

- **Django REST Framework**: Main API backend
- **JWT Authentication**: Access tokens (15 min) with JWKS rotation
- **Refresh Tokens**: Opaque tokens (30 days) with rotation
- **SSO Integration**: OIDC/SAML support for Google, Microsoft, Apple, Okta
- **MFA Support**: TOTP, SMS, Email, Backup codes
- **Consent Middleware**: Privacy-compliant access control
- **Audit Logging**: Comprehensive event tracking

### Data Model

#### Users Table
- `id`: UUID (primary key)
- `email`: CITEXT (case-insensitive, unique)
- `email_verified`: BOOLEAN
- `password_hash`: TEXT (Argon2id, nullable for SSO-only users)
- `account_status`: ENUM (pending_verification, active, suspended, deactivated)
- `preferred_learning_style`, `career_goals`, `cyber_exposure_level`: Mentee onboarding fields

#### Sessions Table
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key)
- `device_fingerprint`: TEXT
- `refresh_token_hash`: TEXT (Argon2id hash, unique)
- `expires_at`: TIMESTAMP
- `revoked_at`: TIMESTAMP (nullable)

#### SSO Connections
- `user_id`: UUID (foreign key)
- `provider_id`: UUID (foreign key to SSOProvider)
- `external_id`: TEXT (provider's user ID)
- `linked_at`: TIMESTAMP

#### API Keys
- `id`: UUID (primary key)
- `owner_type`: ENUM (user, org, service)
- `owner_id`: UUID
- `key_hash`: TEXT (Argon2id hash)
- `scopes`: JSONB (permission scopes)
- `rate_limit_per_min`: INT

#### Consents
- `user_id`: UUID (foreign key)
- `scope`: TEXT (consent scope type)
- `granted`: BOOLEAN
- `granted_at`: TIMESTAMP
- `expires_at`: TIMESTAMP (nullable)

## Authentication Methods

### 1. Email + Password

**Endpoint**: `POST /api/v1/auth/signup`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "first_name": "John",
  "last_name": "Doe",
  "country": "BW",
  "timezone": "Africa/Gaborone",
  "preferred_learning_style": "visual",
  "career_goals": "Become a cybersecurity analyst",
  "cyber_exposure_level": "beginner"
}
```

**Response**:
```json
{
  "detail": "Account created. Please verify your email.",
  "user_id": "uuid-here"
}
```

**Default Role Assignment**: All new users are assigned the "Mentee" role automatically.

### 2. Passwordless (Magic Link)

**Endpoint**: `POST /api/v1/auth/login/magic-link`

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "detail": "Magic link sent to your email"
}
```

### 3. SSO (Single Sign-On)

See [SSO Providers](#sso-providers) section below.

## SSO Providers

### Supported Providers

1. **Google** - OIDC
2. **Microsoft** - OIDC
3. **Apple** - OIDC
4. **Okta** - OIDC/SAML

### Configuration

SSO providers are seeded using the management command:

```bash
python manage.py seed_sso_providers
```

This creates placeholder configurations for all providers. Update credentials in the database or via environment variables.

### SSO Login Flow

**Endpoint**: `POST /api/v1/auth/sso/{provider}`

Where `{provider}` is one of: `google`, `microsoft`, `apple`, `okta`

**Request**:
```json
{
  "id_token": "provider_id_token",
  "access_token": "provider_access_token",
  "device_fingerprint": "web-1234567890",
  "device_name": "Chrome on Windows"
}
```

**Response**:
```json
{
  "access_token": "jwt_access_token",
  "refresh_token": "opaque_refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "roles": [{"role": "mentee", "scope": "global"}],
    "consent_scopes": ["share_with_mentor"]
  },
  "consent_scopes": ["share_with_mentor"]
}
```

### SSO Features

- **JIT User Creation**: Users are created automatically on first SSO login
- **Role Mapping**: Default "Mentee" role assigned (can be extended with IdP group mapping)
- **Identity Linking**: SSO connections are stored and can be managed
- **MFA Enforcement**: If IdP MFA is absent and role requires MFA, user is prompted

## Sessions & Tokens

### Access Tokens

- **Type**: JWT (JSON Web Token)
- **Lifetime**: 15 minutes
- **Audience**: Per service (configurable)
- **Signing**: Rotating keys via JWKS
- **Format**: `Bearer {token}` in Authorization header

### Refresh Tokens

- **Type**: Opaque token (random string)
- **Lifetime**: 30 days
- **Storage**: Hashed with Argon2id in database
- **Binding**: Device-scoped (device_fingerprint)
- **Rotation**: New token issued on each refresh
- **Cookie**: httpOnly, Secure, SameSite=Lax (optional)

### Token Refresh

**Endpoint**: `POST /api/v1/auth/token/refresh`

**Request**:
```json
{
  "refresh_token": "opaque_refresh_token"
}
```

**Response**:
```json
{
  "access_token": "new_jwt_token",
  "refresh_token": "new_opaque_token"
}
```

### Logout/Revocation

**Endpoint**: `POST /api/v1/auth/logout`

**Request**:
```json
{
  "refresh_token": "opaque_refresh_token",
  "revoke_all": false  // Optional: revoke all sessions
}
```

**Response**:
```json
{
  "detail": "Logged out successfully"
}
```

**Features**:
- Refresh token added to blacklist (hash stored)
- Device-scoped revocation
- Global sign-out option (revoke_all=true)

## Organizations & Tenancy

### Organization Model

Organizations represent Sponsors, Employers, or Partners.

**Fields**:
- `id`: UUID
- `name`: TEXT
- `type`: ENUM (sponsor, employer, partner)
- `country`: CHAR(2)
- `status`: ENUM (active, inactive)

### Delegated Admin

Organization admins can:
- Invite members
- Assign roles (scoped to organization)
- Manage sponsored students
- View permitted profiles (with consent)

### Data Segregation

- Scopes: Data segregated by `org_id`
- Employer view: Limited by consent scopes
- Row Level Security (RLS): Applied on org-scoped tables

## API Keys & Service Accounts

### API Key Types

1. **Service Account**: Machine-to-machine authentication
2. **Partner Key**: Partner application integration
3. **Webhook Key**: Webhook endpoint authentication

### Creating API Keys

**Endpoint**: `POST /api/v1/api-keys`

**Request**:
```json
{
  "name": "My Service Key",
  "key_type": "service",
  "scopes": ["read_user", "read_portfolio"],
  "rate_limit_per_min": 60
}
```

**Response**:
```json
{
  "id": "uuid",
  "name": "My Service Key",
  "key": "och_xxxxxxxxxxxxx",  // Only shown once!
  "key_prefix": "och_xxxx",
  "scopes": ["read_user", "read_portfolio"],
  "rate_limit_per_min": 60,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### API Key Authentication

Include API key in request header:

```
X-API-Key: och_xxxxxxxxxxxxx
```

### Rate Limiting

- Per-key rate limiting
- Configurable per minute
- Default: 60 requests/minute

### Webhook Signing

Webhooks are signed with HMAC-SHA256:

```
X-Webhook-Signature: sha256=...
X-Webhook-Timestamp: 1234567890
```

## Consent & Privacy

### Consent Scopes

Available consent scopes:
- `share_with_mentor`: Share data with assigned mentor
- `share_with_sponsor`: Share data with sponsor organization
- `analytics`: Allow analytics processing
- `marketing`: Receive marketing communications
- `research`: Participate in research studies
- `public_portfolio`: Make portfolio publicly visible
- `employer_share`: Share data with employer

### Updating Consents

**Endpoint**: `POST /api/v1/auth/consents`

**Request**:
```json
{
  "scopes": {
    "share_with_mentor": true,
    "analytics": true,
    "marketing": false
  }
}
```

**Response**:
```json
{
  "detail": "Consents updated",
  "consent_scopes": ["share_with_mentor", "analytics"]
}
```

### Consent in Tokens

All tokens include `consent_scopes` claim:

```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "roles": [...],
  "consent_scopes": ["share_with_mentor", "analytics"],
  "exp": 1234567890
}
```

### Consent Middleware

Middleware checks consent scopes for protected resources:

- If required scope missing → 403 Forbidden
- Response includes `required_scope` hint

## Audit & Security

### Audit Events

All authentication events are logged:

- Login (password, SSO, magic link)
- MFA enrollment/verification
- SSO mapping
- Role changes
- Token revocations
- API key usage
- Consent updates

### Security Alerts

Automated alerts for:

- **Brute-force attacks**: Multiple failed login attempts
- **Credential stuffing**: Known credential reuse
- **Anomalous geography**: Login from unusual location
- **Suspicious activity**: Unusual access patterns

### Audit Log Endpoint

**Endpoint**: `GET /api/v1/audit-logs`

**Query Parameters**:
- `actor_id`: Filter by user
- `entity`: Filter by entity type
- `action`: Filter by action
- `start_date`: Start date range
- `end_date`: End date range

## User Interface

### Signup Page

**Location**: `/signup`

**Features**:
- Email + password signup
- SSO provider buttons (Google, Microsoft, Apple, Okta)
- Mentee onboarding fields (learning style, career goals, exposure level)
- Default role: Mentee (assigned automatically)

**SSO Integration**:
- Click SSO provider button
- Redirected to provider's OAuth page
- Return with authorization code
- Exchange for tokens
- User created/authenticated

### Login Page

**Location**: `/login`

**Features**:
- Email + password login
- SSO provider buttons
- Magic link option
- MFA prompt (if enabled)

### SSO Component

Reusable `SSOButtons` component displays all configured SSO providers:

```tsx
<SSOButtons
  mode="signup"  // or "login"
  onSuccess={() => router.push('/dashboard')}
  onError={(error) => setError(error)}
/>
```

## Setup & Configuration

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

Key packages:
- `argon2-cffi`: Password and token hashing
- `PyJWT`: JWT token handling
- `djangorestframework-simplejwt`: JWT authentication
- `requests`: SSO token verification

### 2. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Seed SSO Providers

```bash
python manage.py seed_sso_providers
```

### 4. Configure Environment Variables

```env
# Google SSO
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret

# Microsoft SSO
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret

# Apple SSO
APPLE_CLIENT_ID=your-client-id
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id

# Okta SSO
OKTA_DOMAIN=your-domain.okta.com
OKTA_CLIENT_ID=your-client-id
OKTA_CLIENT_SECRET=your-client-secret
```

### 5. Update SSO Provider Credentials

After seeding, update provider credentials in the database:

```python
from users.auth_models import SSOProvider

provider = SSOProvider.objects.get(name='google')
provider.client_id = 'your-actual-client-id'
provider.client_secret = 'your-actual-client-secret'
provider.save()
```

Or use Django admin at `/admin/users/ssoprovider/`

### 6. Frontend Configuration

Update frontend environment variables:

```env
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your-client-id
```

## API Endpoints Summary

### Authentication
- `POST /api/v1/auth/signup` - Create account
- `POST /api/v1/auth/login` - Password login
- `POST /api/v1/auth/login/magic-link` - Request magic link
- `POST /api/v1/auth/sso/{provider}` - SSO login
- `POST /api/v1/auth/token/refresh` - Refresh tokens
- `POST /api/v1/auth/logout` - Logout/revoke
- `GET /api/v1/auth/me` - Current user profile
- `POST /api/v1/auth/consents` - Update consents

### MFA
- `POST /api/v1/auth/mfa/enroll` - Enroll MFA
- `POST /api/v1/auth/mfa/verify` - Verify MFA
- `POST /api/v1/auth/mfa/disable` - Disable MFA

### Password Reset
- `POST /api/v1/auth/password/reset/request` - Request reset
- `POST /api/v1/auth/password/reset/confirm` - Confirm reset

### Admin/Management
- `POST /api/v1/roles` - Create role
- `GET /api/v1/roles` - List roles
- `POST /api/v1/users/{id}/roles` - Assign role
- `POST /api/v1/orgs` - Create organization
- `POST /api/v1/orgs/{id}/members` - Add member
- `POST /api/v1/api-keys` - Create API key
- `DELETE /api/v1/api-keys/{id}` - Revoke API key
- `GET /api/v1/audit-logs` - List audit logs

## Security Best Practices

1. **Password Hashing**: Argon2id with per-user salt
2. **Token Storage**: Refresh tokens hashed with Argon2id
3. **API Keys**: Stored hashed, never in plaintext
4. **Secrets**: Encrypted at rest (KMS recommended)
5. **HTTPS**: Required in production
6. **Rate Limiting**: Applied to all endpoints
7. **CORS**: Properly configured for frontend
8. **Audit Logging**: All auth events logged
9. **MFA**: Recommended for sensitive roles
10. **Consent**: Required for data sharing

## Troubleshooting

### SSO Not Working

1. Check provider credentials in database
2. Verify redirect URIs match provider configuration
3. Check OAuth scopes are correct
4. Review audit logs for errors

### Token Refresh Failing

1. Verify refresh token not revoked
2. Check token expiration
3. Ensure device fingerprint matches
4. Review session in database

### Consent Issues

1. Check consent scopes in token
2. Verify middleware is enabled
3. Review consent records in database
4. Check required scopes for endpoint

## Next Steps

1. **Production Deployment**:
   - Configure real SSO provider credentials
   - Set up JWKS key rotation
   - Enable HTTPS
   - Configure KMS for secret encryption

2. **Enhanced Features**:
   - Implement IdP group to role mapping
   - Add SAML support
   - Enhance security alerts
   - Add device management UI

3. **Monitoring**:
   - Set up audit log dashboards
   - Configure security alert notifications
   - Monitor token usage patterns
   - Track SSO adoption metrics

