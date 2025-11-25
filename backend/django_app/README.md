# Ongoza CyberHub - Django Backend

Django REST API backend for the Ongoza CyberHub platform, providing comprehensive identity, authentication, and authorization services.

## Quick Start

```bash
# 1. Setup environment
cd backend/django_app
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env  # Edit with your settings

# 3. Setup database
python manage.py create_db
python manage.py migrate
python manage.py seed_roles_permissions

# 4. Create superuser (optional)
python manage.py createsuperuser

# 5. Run server
python manage.py runserver
```

## Documentation

- **[Complete Setup & Testing Guide](SETUP_AND_TESTING.md)** - Comprehensive setup instructions and endpoint testing
- **[Quick Start Guide](QUICK_START.md)** - Quick setup for development
- **[Database Setup](DATABASE_SETUP.md)** - Database configuration details
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - What's been implemented

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Create account
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/login/magic-link` - Request magic link
- `POST /api/v1/auth/mfa/enroll` - Enroll in MFA
- `POST /api/v1/auth/mfa/verify` - Verify MFA
- `POST /api/v1/auth/token/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Current user profile
- `POST /api/v1/auth/consents` - Update consents
- `POST /api/v1/auth/password/reset/request` - Request reset
- `POST /api/v1/auth/password/reset/confirm` - Confirm reset

### Management
- `GET /api/v1/roles` - List roles
- `POST /api/v1/users/{id}/roles` - Assign role
- `DELETE /api/v1/users/{id}/roles/{id}` - Revoke role
- `POST /api/v1/orgs` - Create organization
- `GET /api/v1/orgs` - List organizations
- `POST /api/v1/orgs/{slug}/members` - Add member
- `POST /api/v1/api-keys` - Create API key
- `DELETE /api/v1/api-keys/{id}` - Revoke API key
- `GET /api/v1/audit-logs` - List audit logs
- `GET /api/v1/audit-logs/stats` - Audit statistics

### OIDC Discovery
- `GET /.well-known/openid-configuration` - OIDC discovery
- `GET /.well-known/jwks.json` - JSON Web Key Set

## API Documentation

- **Swagger UI:** http://localhost:8000/api/schema/swagger-ui/
- **ReDoc:** http://localhost:8000/api/schema/redoc/

## Testing

### Quick Test Script

```bash
./scripts/test_endpoints.sh
```

### Manual Testing

See [SETUP_AND_TESTING.md](SETUP_AND_TESTING.md) for detailed curl examples and testing workflows.

## Features

### ✅ Implemented

- **Account Lifecycle** - Signup, verification, activation, deactivation, erasure
- **Authentication** - Email+password, passwordless (magic link/OTP), MFA (TOTP with backup codes)
- **Authorization** - RBAC roles + ABAC policy engine
- **Sessions & Tokens** - JWT (15 min) + refresh tokens (30 days, rotating, device-bound)
- **Organizations** - Type-based orgs with delegated admin
- **API Keys** - Scoped keys with rate limiting
- **Consent Management** - GDPR/DPA compliant consent tracking
- **Audit Logging** - Comprehensive audit trail
- **Email Integration** - Magic links, OTP, verification, password reset
- **OIDC Discovery** - OpenID Connect discovery endpoints

### ⏳ In Progress / Planned

- OAuth2/OIDC flows (structure ready, needs implementation)
- SSO OIDC/SAML flows
- Webhook delivery system
- Rate limiting per endpoint
- Row Level Security (RLS) on PostgreSQL

## Tech Stack

- **Framework:** Django 5.0+
- **API:** Django REST Framework
- **Authentication:** JWT (djangorestframework-simplejwt)
- **Password Hashing:** Argon2id
- **MFA:** TOTP (pyotp)
- **Database:** PostgreSQL 14+
- **API Docs:** drf-spectacular (OpenAPI 3.0)
- **CORS:** django-cors-headers

## Project Structure

```
backend/django_app/
├── core/              # Django project settings
├── users/             # User, auth, identity models and views
├── organizations/     # Organization models and views
├── progress/          # Progress tracking models
├── api/               # API URL routing
├── shared_schemas/    # Shared DRF serializers
└── scripts/           # Utility scripts
```

## Environment Variables

See `.env.example` or `SETUP_AND_TESTING.md` for complete list of environment variables.

Key variables:
- `DJANGO_SECRET_KEY` - Django secret key
- `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database credentials
- `EMAIL_*` - Email configuration
- `FRONTEND_URL` - Frontend URL for email links
- `CORS_ALLOWED_ORIGINS` - CORS allowed origins

## Development

### Running Tests

```bash
python manage.py test
```

### Creating Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Django Shell

```bash
python manage.py shell
```

### Admin Panel

http://localhost:8000/admin

## License

[Your License Here]

## Support

For setup issues, see [SETUP_AND_TESTING.md](SETUP_AND_TESTING.md) troubleshooting section.

