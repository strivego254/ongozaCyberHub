# Quick Start Guide

## Fresh Migration Setup

### Step 1: Clean Slate

```bash
cd backend/django_app

# Remove old migrations 
find . -path "*/migrations/*.py" -not -name "__init__.py" -type f -delete
```

### Step 2: Create Migrations

```bash
# 1. Users first (no dependency on organizations)
python manage.py makemigrations users --name initial

# 2. Organizations (depends on users via AUTH_USER_MODEL)
python manage.py makemigrations organizations --name initial

# 3. Progress
python manage.py makemigrations progress --name initial

# 4. Verify
python manage.py showmigrations
```

### Step 3: Run Migrations

```bash
python manage.py migrate
```

### Step 4: Seed Data

```bash
# Seed roles and permissions
python manage.py seed_roles_permissions

# Create superuser
python manage.py createsuperuser
```

### Step 5: Install Additional Dependencies

```bash
pip install pyotp  # For TOTP MFA support
```

### Step 6: Start Server

```bash
python manage.py runserver
```

## Test Endpoints

### Signup
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "first_name": "Test",
    "last_name": "User",
    "country": "BW",
    "timezone": "Africa/Gaborone"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "device_fingerprint": "device123"
  }'
```

### Get Current User
```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

## API Endpoints Summary

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

## Next Steps

1. ✅ Email sending implemented (magic links, OTP)
2. ✅ TOTP implementation complete (with backup codes)
3. ⏳ SSO OIDC/SAML flows (structure ready, needs implementation)
4. ✅ Audit log endpoint implemented
5. ✅ OIDC discovery endpoints added
6. 📖 See SETUP_AND_TESTING.md for complete testing guide

## Documentation

- **Complete Setup Guide:** See `SETUP_AND_TESTING.md` for detailed setup and testing instructions
- **Database Setup:** See `DATABASE_SETUP.md` for database configuration
- **API Documentation:** http://localhost:8000/api/schema/swagger-ui/


