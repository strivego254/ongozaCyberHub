# Identity & Access Management System

## Overview

Comprehensive identity, authentication, and authorization system for Ongoza CyberHub platform with RBAC/ABAC support, MFA, SSO, and GDPR/DPA compliance.

## Models Created

### Core Identity Models (`models.py`)

1. **User** - Enhanced user model with:
   - Account lifecycle (pending_verification → active → deactivated → erased)
   - ABAC attributes (cohort_id, track_key, org_id, country, timezone)
   - Risk level tracking
   - MFA status
   - Profile fields

2. **Role** - RBAC roles:
   - Admin, Program Director, Mentor, Student, Finance, Sponsor Admin, Analyst
   - System roles (cannot be deleted)
   - Permission assignments

3. **Permission** - Fine-grained permissions:
   - Resource-based (user, organization, cohort, track, portfolio, etc.)
   - Action-based (create, read, update, delete, list, manage)

4. **UserRole** - Role assignments with context:
   - Cohort-specific roles
   - Track-specific roles
   - Organization-specific roles
   - Expiration support

5. **ConsentScope** - GDPR/DPA compliance:
   - Consent tracking (share_with_mentor, share_with_sponsor, analytics, etc.)
   - Grant/revoke timestamps
   - Expiration support

6. **Entitlement** - Feature access control:
   - Feature-level entitlements
   - Expiration support
   - Metadata storage

### Authentication Models (`auth_models.py`)

1. **MFAMethod** - Multi-factor authentication:
   - TOTP (Time-based OTP)
   - SMS
   - Email
   - Backup codes

2. **MFACode** - Temporary MFA codes:
   - OTP codes
   - Magic links
   - Expiration tracking

3. **SSOProvider** - SSO provider configuration:
   - OIDC (OpenID Connect)
   - SAML 2.0
   - OAuth 2.0

4. **SSOConnection** - User SSO links:
   - External ID mapping
   - Token storage (encrypted)
   - Sync tracking

5. **UserSession** - Session management:
   - Device tracking
   - Trust status
   - MFA verification status
   - Risk scoring

6. **DeviceTrust** - Trusted devices:
   - Device fingerprinting
   - Trust expiration
   - Skip MFA on trusted devices

### API Models (`api_models.py`)

1. **APIKey** - API key management:
   - Service/Partner/Webhook keys
   - Scope-based permissions
   - IP whitelisting
   - Rate limiting
   - Key rotation support

2. **WebhookEndpoint** - Webhook configuration:
   - Event subscriptions
   - HMAC signing
   - Retry configuration

3. **WebhookDelivery** - Webhook delivery logs:
   - Delivery status tracking
   - Retry management
   - Response logging

### Audit Models (`audit_models.py`)

1. **AuditLog** - Comprehensive audit trail:
   - All system actions
   - User/API key actions
   - Change tracking
   - Request context

2. **DataExport** - GDPR data export:
   - Export requests
   - File tracking
   - Expiration management

3. **DataErasure** - GDPR data erasure:
   - Erasure requests
   - Anonymization tracking
   - Compliance logging

## Database Schema

### Key Relationships

```
User
├── UserRole (many-to-many through UserRole)
│   └── Role
│       └── Permission (many-to-many)
├── ConsentScope (one-to-many)
├── Entitlement (one-to-many)
├── MFAMethod (one-to-many)
├── SSOConnection (one-to-many)
├── UserSession (one-to-many)
├── DeviceTrust (one-to-many)
├── APIKey (one-to-many)
└── Organization (foreign key)

Organization
├── APIKey (one-to-many)
└── WebhookEndpoint (one-to-many)
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend/django_app
pip install -r requirements.txt
```

### 2. Create Database Migrations

```bash
python manage.py makemigrations users
```

### 3. Run Migrations

```bash
python manage.py migrate
```

### 4. Seed Initial Roles and Permissions

```bash
python manage.py seed_roles_permissions
```

This will create:
- All system roles (Admin, Program Director, Mentor, Student, Finance, Sponsor Admin, Analyst)
- All permissions for each resource type
- Role-permission assignments

## Role Permissions Summary

### Admin
- **All permissions** - Full platform access

### Program Director
- Manage cohorts and tracks
- View analytics
- Assign mentors
- Read portfolios and profiling data

### Mentor
- Access assigned mentees (with consent)
- Create mentorship notes
- Review portfolios
- Limited analytics

### Student
- Manage own profile
- Access own portfolio, profiling, mentorship
- View own progress

### Finance
- Access billing and invoices
- Manage refunds
- No access to student PII beyond billing

### Sponsor/Employer Admin
- Manage sponsored users
- View profiles (with consent)
- Manage own organization

### Analyst
- Read analytics (with RLS/CLS)
- No PII access without proper scope

## ABAC Policy Examples

### Mentor Access to Mentee Profiling
```
IF user.role == 'mentor' 
AND match_exists(user_id, mentor_id)
AND consent_scopes.includes('share_with_mentor')
THEN allow READ profiling
```

### Director Access to Cohort Portfolios
```
IF user.role == 'program_director'
AND user.cohort_id == request.cohort_id
THEN allow LIST portfolios
```

### Finance Access to Invoices
```
IF user.role == 'finance'
AND (invoice.org_id == user.org_id OR user.role == 'admin')
THEN allow READ invoice
```

## Next Steps

1. **Create Serializers** - DRF serializers for all models
2. **Implement Permission Classes** - RBAC/ABAC permission classes
3. **Create Views/Endpoints** - API endpoints for:
   - Authentication (login, MFA, SSO)
   - Authorization (roles, permissions)
   - User management
   - Consent management
   - API key management
   - Audit logs

4. **Implement Middleware** - Token validation and policy enforcement
5. **Create Tests** - Comprehensive test suite

## Security Considerations

- All sensitive data (tokens, secrets) should be encrypted at rest
- Use Django's password hashing (already in AbstractUser)
- Implement rate limiting on authentication endpoints
- Use HTTPS in production
- Implement proper CORS policies
- Regular security audits via AuditLog
- GDPR/DPA compliance via ConsentScope, DataExport, DataErasure

## Compliance Features

- **GDPR/DPA Compliance**:
  - Consent tracking (ConsentScope)
  - Data export (DataExport)
  - Data erasure (DataErasure)
  - Audit trail (AuditLog)

- **Security**:
  - MFA support
  - Session management
  - Device trust
  - Risk scoring
  - API key rotation

## API Endpoints (To Be Implemented)

### Authentication
- `POST /api/v1/auth/login/` - Email/password login
- `POST /api/v1/auth/mfa/verify/` - MFA verification
- `POST /api/v1/auth/sso/{provider}/` - SSO login
- `POST /api/v1/auth/logout/` - Logout
- `POST /api/v1/auth/refresh/` - Refresh token

### User Management
- `GET /api/v1/users/me/` - Current user profile
- `PATCH /api/v1/users/me/` - Update profile
- `GET /api/v1/users/{id}/` - Get user (with permissions)

### Roles & Permissions
- `GET /api/v1/roles/` - List roles
- `POST /api/v1/users/{id}/roles/` - Assign role
- `DELETE /api/v1/users/{id}/roles/{role_id}/` - Revoke role

### Consent
- `GET /api/v1/consents/` - List consents
- `POST /api/v1/consents/` - Grant consent
- `DELETE /api/v1/consents/{id}/` - Revoke consent

### API Keys
- `GET /api/v1/api-keys/` - List API keys
- `POST /api/v1/api-keys/` - Create API key
- `DELETE /api/v1/api-keys/{id}/` - Revoke API key

### Audit
- `GET /api/v1/audit-logs/` - List audit logs (admin only)

