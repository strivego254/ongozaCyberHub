# Complete Setup and Testing Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Email Configuration](#email-configuration)
5. [Running the Application](#running-the-application)
6. [Testing Endpoints](#testing-endpoints)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Python 3.12+**
- **PostgreSQL 14+** installed and running
- **Virtual environment** (recommended)
- **curl** or **Postman** for API testing

---

## Environment Setup

### 1. Create Virtual Environment

```bash
cd backend/django_app
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

**Required packages:**
- Django 5.0+
- djangorestframework
- djangorestframework-simplejwt
- drf-spectacular (OpenAPI docs)
- psycopg2-binary (PostgreSQL driver)
- python-dotenv (environment variables)
- argon2-cffi (password hashing)
- pyotp (TOTP MFA support)
- django-cors-headers (CORS support)

### 3. Create `.env` File

Create a `.env` file in `backend/django_app/` directory:

```bash
cat > .env << 'EOF'
# Django Settings
DJANGO_SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True

# Database Configuration
DB_NAME=ongozacyberhub
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_HOST=localhost
DB_PORT=5432

# Email Configuration (for production)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@ongozacyberhub.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_AUDIENCE=ongozacyberhub
JWT_ISSUER=ongozacyberhub

# FastAPI Communication
FASTAPI_BASE_URL=http://localhost:8001

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
EOF
```

**Important:** 
- Replace `your-postgres-password` with your actual PostgreSQL password
- For development, `EMAIL_BACKEND` is set to console backend (emails print to console)
- For production, configure SMTP settings

---

## Database Setup

### 1. Ensure PostgreSQL is Running

**Linux:**
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

**macOS:**
```bash
brew services start postgresql
```

**Windows:**
Check Services panel or use pgAdmin

### 2. Create Database

**Option A: Using Django Management Command (Recommended)**
```bash
python manage.py create_db
```

**Option B: Using PostgreSQL CLI**
```bash
psql -U postgres
CREATE DATABASE ongozacyberhub;
\q
```

**Option C: Using Python Script**
```bash
python scripts/create_db.py
```

### 3. Run Migrations

```bash
# Create migrations
python manage.py makemigrations users --name initial
python manage.py makemigrations organizations --name initial
python manage.py makemigrations progress --name initial

# Apply migrations
python manage.py migrate
```

### 4. Seed Initial Data

```bash
# Seed roles and permissions
python manage.py seed_roles_permissions

# Create superuser (optional)
python manage.py createsuperuser
```

---

## Email Configuration

### Development (Console Backend)

For development, emails are printed to the console. No additional configuration needed.

```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Production (SMTP)

For production, configure SMTP settings:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@ongozacyberhub.com
```

**Gmail Setup:**
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `EMAIL_HOST_PASSWORD`

**Note:** Email templates need to be created in `users/templates/emails/`:
- `magic_link.html`
- `otp_code.html`
- `verify_email.html`
- `password_reset.html`
- `mfa_enabled.html`

For now, plain text emails are sent. HTML templates can be added later.

---

## Running the Application

### Start Development Server

```bash
python manage.py runserver
```

Server will start at: **http://localhost:8000**

### Verify Setup

1. **Health Check:**
   ```bash
   curl http://localhost:8000/api/v1/health/
   ```

2. **API Documentation:**
   - Swagger UI: http://localhost:8000/api/schema/swagger-ui/
   - ReDoc: http://localhost:8000/api/schema/redoc/

3. **Admin Panel:**
   - URL: http://localhost:8000/admin
   - Use superuser credentials

---

## Testing Endpoints

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication Endpoints

#### 1. Signup (Email + Password)

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "first_name": "Test",
    "last_name": "User",
    "country": "BW",
    "timezone": "Africa/Gaborone",
    "language": "en"
  }'
```

**Response:**
```json
{
  "detail": "Account created. Please verify your email.",
  "user_id": 1
}
```

#### 2. Signup (Passwordless)

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "first_name": "Test",
    "last_name": "User",
    "passwordless": true
  }'
```

#### 3. Login (Email + Password)

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "device_fingerprint": "device123",
    "device_name": "My Laptop"
  }'
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    ...
  }
}
```

**Save the tokens:**
```bash
export ACCESS_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."
export REFRESH_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."
```

#### 4. Request Magic Link

```bash
curl -X POST http://localhost:8000/api/v1/auth/login/magic-link \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Note:** Check console for magic link code (development mode)

#### 5. Get Current User Profile

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**
```json
{
  "id": 1,
  "email": "test@example.com",
  "first_name": "Test",
  "last_name": "User",
  "roles": [],
  "consent_scopes": [],
  "entitlements": [],
  ...
}
```

#### 6. Enroll in MFA (TOTP)

```bash
curl -X POST http://localhost:8000/api/v1/auth/mfa/enroll \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "totp"
  }'
```

**Response:**
```json
{
  "mfa_method_id": "uuid-here",
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code_uri": "otpauth://totp/Ongoza%20CyberHub:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Ongoza%20CyberHub"
}
```

**Use the `qr_code_uri` to generate QR code or enter `secret` manually in authenticator app.**

#### 7. Verify MFA (TOTP)

```bash
curl -X POST http://localhost:8000/api/v1/auth/mfa/verify \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456",
    "method": "totp"
  }'
```

**Response:**
```json
{
  "detail": "MFA enabled successfully",
  "backup_codes": [
    "backup-code-1",
    "backup-code-2",
    ...
  ]
}
```

**Important:** Save backup codes securely. They're only shown once.

#### 8. Refresh Token

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "$REFRESH_TOKEN",
    "device_fingerprint": "device123"
  }'
```

**Response:**
```json
{
  "access_token": "new-access-token...",
  "refresh_token": "new-refresh-token..."
}
```

#### 9. Update Consents

```bash
curl -X POST http://localhost:8000/api/v1/auth/consents \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scope_type": "share_with_mentor",
    "granted": true
  }'
```

#### 10. Request Password Reset

```bash
curl -X POST http://localhost:8000/api/v1/auth/password/reset/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Note:** Check console for reset token (development mode)

#### 11. Confirm Password Reset

```bash
curl -X POST http://localhost:8000/api/v1/auth/password/reset/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "new_password": "NewSecurePass123!"
  }'
```

#### 12. Logout

```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "$REFRESH_TOKEN"
  }'
```

### Management Endpoints

#### 13. List Roles

```bash
curl http://localhost:8000/api/v1/roles \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "name": "admin",
      "display_name": "Admin",
      "description": "Full platform admin",
      ...
    },
    ...
  ]
}
```

#### 14. Assign Role to User

```bash
curl -X POST http://localhost:8000/api/v1/users/1/roles \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": 2,
    "scope": "global",
    "scope_ref": null
  }'
```

#### 15. Revoke Role from User

```bash
curl -X DELETE http://localhost:8000/api/v1/users/1/roles/1 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### 16. Create Organization

```bash
curl -X POST http://localhost:8000/api/v1/orgs \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Organization",
    "slug": "test-org",
    "org_type": "sponsor"
  }'
```

#### 17. List Organizations

```bash
curl http://localhost:8000/api/v1/orgs \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### 18. Add Member to Organization

```bash
curl -X POST http://localhost:8000/api/v1/orgs/test-org/members \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "role_id": 4
  }'
```

#### 19. Create API Key

```bash
curl -X POST http://localhost:8000/api/v1/api-keys \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My API Key",
    "key_type": "service",
    "scopes": ["read:users", "write:users"]
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "My API Key",
  "key_prefix": "och_abc123",
  "key": "och_abc123def456...",
  "detail": "Store this key securely. It will not be shown again."
}
```

**Important:** Save the key immediately. It won't be shown again.

#### 20. Revoke API Key

```bash
curl -X DELETE http://localhost:8000/api/v1/api-keys/1 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Audit Log Endpoints

#### 21. List Audit Logs

```bash
curl http://localhost:8000/api/v1/audit-logs \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**With Filters:**
```bash
curl "http://localhost:8000/api/v1/audit-logs?start_date=2024-01-01&action=login&result=success" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### 22. Get Audit Log Statistics

```bash
curl http://localhost:8000/api/v1/audit-logs/stats \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### OIDC Discovery Endpoints

#### 23. OpenID Configuration

```bash
curl http://localhost:8000/.well-known/openid-configuration
```

#### 24. JWKS (JSON Web Key Set)

```bash
curl http://localhost:8000/.well-known/jwks.json
```

---

## Testing Workflow Example

### Complete User Journey

```bash
# 1. Signup
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Pass123!", "first_name": "John", "last_name": "Doe"}'

# 2. Login
RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Pass123!", "device_fingerprint": "device1"}')

# Extract tokens (requires jq)
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refresh_token')

# 3. Get profile
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 4. Enroll MFA
curl -X POST http://localhost:8000/api/v1/auth/mfa/enroll \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method": "totp"}'

# 5. Verify MFA (use code from authenticator app)
curl -X POST http://localhost:8000/api/v1/auth/mfa/verify \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "123456", "method": "totp"}'

# 6. Refresh token
curl -X POST http://localhost:8000/api/v1/auth/token/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"

# 7. Logout
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"
```

---

## Troubleshooting

### Database Connection Issues

**Error:** `django.db.utils.OperationalError: could not connect to server`

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql  # Linux
   brew services list | grep postgresql  # macOS
   ```

2. Check credentials in `.env` file

3. Test connection:
   ```bash
   psql -U postgres -h localhost -d ongozacyberhub
   ```

4. Grant permissions:
   ```sql
   psql -U postgres
   ALTER USER postgres CREATEDB;
   GRANT ALL PRIVILEGES ON DATABASE ongozacyberhub TO postgres;
   ```

### Migration Errors

**Error:** `django.db.migrations.exceptions.CircularDependencyError`

**Solution:**
1. Delete all migration files (except `__init__.py`)
2. Create migrations in order:
   ```bash
   python manage.py makemigrations users
   python manage.py makemigrations organizations
   python manage.py makemigrations progress
   python manage.py migrate
   ```

**Error:** `relation "table_name" does not exist`

**Solution:**
```bash
python manage.py migrate --run-syncdb
```

### Email Not Sending

**Development Mode:**
- Emails print to console (check terminal output)
- Verify `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend`

**Production Mode:**
- Check SMTP settings in `.env`
- Verify `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`
- For Gmail, use App Password (not regular password)
- Check firewall/network settings

### Token Errors

**Error:** `Token is invalid or expired`

**Solutions:**
1. Check token hasn't expired (15 minutes for access token)
2. Use refresh token to get new access token
3. Verify `JWT_SECRET_KEY` matches in settings

**Error:** `Refresh token is invalid`

**Solutions:**
1. Refresh tokens expire after 30 days
2. Token may have been revoked (logout)
3. Request new login

### Permission Denied Errors

**Error:** `permission denied for schema public`

**Solution:**
```sql
psql -U postgres
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

### Import Errors

**Error:** `ModuleNotFoundError: No module named 'pyotp'`

**Solution:**
```bash
pip install pyotp
pip install -r requirements.txt  # Install all dependencies
```

### CORS Errors (Frontend)

**Error:** `Access-Control-Allow-Origin` header missing

**Solution:**
1. Add frontend URL to `CORS_ALLOWED_ORIGINS` in `.env`:
   ```env
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

2. Restart Django server

### TOTP Verification Fails

**Issue:** TOTP code always fails

**Solutions:**
1. Ensure system time is synchronized (TOTP is time-based)
2. Check code hasn't expired (30-second window)
3. Verify secret was entered correctly in authenticator app
4. Try backup codes if available

---

## Additional Resources

- **API Documentation:** http://localhost:8000/api/schema/swagger-ui/
- **Admin Panel:** http://localhost:8000/admin
- **Health Check:** http://localhost:8000/api/v1/health/
- **OIDC Discovery:** http://localhost:8000/.well-known/openid-configuration

---

## Next Steps

1. Set up email templates in `users/templates/emails/`
2. Configure production SMTP settings
3. Implement OAuth2/OIDC flows (currently placeholders)
4. Set up webhook delivery system
5. Add rate limiting
6. Configure logging and monitoring

---

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in console/logs
3. Check Django admin panel for data integrity
4. Verify environment variables in `.env`

