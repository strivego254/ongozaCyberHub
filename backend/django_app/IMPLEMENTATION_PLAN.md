# Implementation Plan: Core Functional Requirements

## Current Status
- ✅ Basic models created (User, Role, Permission, etc.)
- ✅ MFA, SSO, API Keys, Audit models scaffolded
- ⚠️ Circular dependency issue being fixed
- ❌ Need to align with detailed requirements

## Required Updates

### 1. Account Lifecycle (4.1)
**Current**: Basic status fields exist
**Needed**:
- [ ] Add `language` field to User
- [ ] Implement invite flow
- [ ] Add soft-lock for suspend
- [ ] Implement erasure workflow with downstream purge signals
- [ ] Add legal ledger retention for billing

### 2. Authentication (4.2)
**Current**: Basic MFA models exist
**Needed**:
- [ ] Switch to Argon2id password hashing (Django 4.0+ supports)
- [ ] Implement passwordless magic link (10 min expiry)
- [ ] Implement OTP (email/SMS)
- [ ] Complete TOTP implementation (RFC 6238)
- [ ] Add MFA policy per role (Finance/Admin = mandatory)
- [ ] Implement SSO OIDC/SAML with JIT provisioning
- [ ] Add risk signals (device, geo-velocity, TOR/VPN detection)

### 3. Authorization (4.3)
**Current**: RBAC/ABAC models exist
**Needed**:
- [ ] Implement policy engine for ABAC evaluation
- [ ] Add environment context (time, IP reputation)
- [ ] Implement entitlements middleware
- [ ] Add feature gating from Billing

### 4. Sessions & Tokens (4.4)
**Current**: Basic session model exists
**Needed**:
- [ ] Implement JWT with 15 min expiry
- [ ] Implement refresh tokens (opaque, 30 days, rotating)
- [ ] Add device binding for refresh tokens
- [ ] Implement token blacklist
- [ ] Add JWKS for key rotation
- [ ] Set httpOnly, Secure, SameSite=Lax cookies

### 5. Organizations & Tenancy (4.5)
**Current**: Basic Organization model exists
**Needed**:
- [ ] Add organization type (sponsor, employer, partner)
- [ ] Implement delegated admin functionality
- [ ] Add data segregation by org_id
- [ ] Implement consent-based employer views

### 6. API Keys & Integrations (4.6)
**Current**: Basic APIKey model exists
**Needed**:
- [ ] Add service accounts (machine-to-machine)
- [ ] Implement OAuth2 Client Credentials flow
- [ ] Implement Authorization Code with PKCE
- [ ] Add rate limiting per key
- [ ] Complete webhook HMAC signing

### 7. Consent & Privacy (4.7)
**Current**: ConsentScope model exists
**Needed**:
- [ ] Embed consent_scopes in all tokens
- [ ] Add middleware to check consent scopes
- [ ] Implement consent scope validation per request

### 8. Audit & Security (4.8)
**Current**: AuditLog model exists
**Needed**:
- [ ] Complete audit logging for all auth events
- [ ] Add security alerts (brute-force, credential stuffing)
- [ ] Implement anomalous geography detection

### 9. Data Model Updates
**Needed**:
- [ ] Change User.id to UUID (currently BigAutoField)
- [ ] Change email to CITEXT for case-insensitive uniqueness
- [ ] Add user_identities table for SSO links
- [ ] Update mfa_factors structure
- [ ] Update roles/user_roles with scope enum
- [ ] Add policies table
- [ ] Update orgs with type enum
- [ ] Update sessions with refresh_token_hash
- [ ] Add RLS (Row Level Security) on org-scoped tables

### 10. API Endpoints (7)
**Needed**:
- [ ] POST /api/v1/auth/signup
- [ ] POST /api/v1/auth/login
- [ ] POST /api/v1/auth/login/magic-link
- [ ] POST /api/v1/auth/mfa/enroll
- [ ] POST /api/v1/auth/mfa/verify
- [ ] POST /api/v1/auth/token/refresh
- [ ] POST /api/v1/auth/logout
- [ ] GET /api/v1/auth/me
- [ ] POST /api/v1/auth/consents
- [ ] POST /api/v1/auth/password/reset/request
- [ ] POST /api/v1/auth/password/reset/confirm
- [ ] Admin endpoints for roles, users, orgs, API keys
- [ ] OIDC endpoints (.well-known/openid-configuration, etc.)
- [ ] Webhook endpoints

## Implementation Order

1. **Fix Circular Dependency** ✅ (In progress)
2. **Update Data Models** (UUID, CITEXT, new tables)
3. **Implement Authentication** (Argon2id, passwordless, MFA, SSO)
4. **Implement Authorization** (Policy engine, ABAC)
5. **Implement Sessions & Tokens** (JWT, refresh tokens)
6. **Implement API Endpoints**
7. **Add Security Features** (Risk signals, alerts)
8. **Add Audit & Compliance**

## Next Steps

1. Fix circular dependency
2. Update User model with new fields
3. Create user_identities model
4. Update password hashing to Argon2id
5. Implement JWT with refresh tokens
6. Create authentication views
7. Create authorization middleware
8. Implement consent checking middleware


