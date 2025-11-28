# Persona-Based Authentication Flows

## Overview

Ongoza CyberHub supports role-based authentication with persona-aware routing. Each persona has a dedicated dashboard and authentication flow.

## Supported Personas

1. **Student** (default)
2. **Mentor**
3. **Admin**
4. **Program Director**
5. **Sponsor Admin**
6. **Analyst**

## Authentication Flow

### 1. Landing Page → Signup/Login

**Path**: `/` (landing page)

**User Action**: Click persona card or navigation link

**Routing**:
- Student: `/signup?persona=student` or `/login?persona=student`
- Mentor: `/signup?persona=mentor` or `/login?persona=mentor`
- Admin: `/signup?persona=admin` or `/login?persona=admin`
- Director: `/signup?persona=director` or `/login?persona=director`
- Sponsor: `/signup?persona=sponsor` or `/login?persona=sponsor`
- Analyst: `/signup?persona=analyst` or `/login?persona=analyst`

### 2. Signup Flow

**Path**: `/signup?persona={role}`

**Process**:
1. User selects persona (or arrives with persona param)
2. Form displays with persona-specific styling
3. User fills in details (email, password, name, etc.)
4. On submit:
   - POST `/api/v1/auth/signup`
   - Backend assigns default "Mentee" role (per specification)
   - User redirected to `/login?persona={role}&registered=true`
5. User logs in with credentials

**Default Role Assignment**:
- All new users receive "Mentee" role by default
- Additional roles assigned by invitation or admin

### 3. Login Flow

**Path**: `/login?persona={role}`

**Process**:
1. User enters email and password
2. Optional: SSO login (Google, Microsoft, Apple, Okta)
3. On submit:
   - POST `/api/v1/auth/login`
   - Backend validates credentials
   - Returns JWT access token and refresh token
   - Tokens stored in localStorage and cookies
4. User redirected to dashboard based on roles

**SSO Login**:
- Click SSO provider button
- Redirected to provider OAuth page
- Return with authorization code
- Exchange for tokens
- User created/authenticated
- Default "Mentee" role assigned

### 4. Dashboard Routing

**Path**: `/dashboard`

**Default**: Redirects to `/dashboard/student`

**Role-Based Routing**:
- **Student**: `/dashboard/student`
- **Mentor**: `/dashboard/mentor`
- **Admin**: `/dashboard/admin`
- **Program Director**: `/dashboard/director`
- **Analyst**: `/dashboard/analyst`

**Multi-Role Handling**:
- If user has multiple roles, show role switcher
- Default to first role in user.roles array
- Allow manual role switching

### 5. Dashboard Access

**Authentication Check**:
- Middleware checks for access token
- If missing, redirect to `/login`
- If present, allow access to dashboard

**Role Verification**:
- Dashboard components check user roles
- If user lacks required role, show access denied
- Redirect to appropriate dashboard if role mismatch

## Persona-Specific Features

### Student Dashboard

**Features**:
- Learning progress tracking
- Module completion status
- Mentor session scheduling
- Portfolio building
- Assignment deadlines

**Access**: Users with "student" or "mentee" role

### Mentor Dashboard

**Features**:
- Active mentees list
- Session scheduling
- Progress reviews
- Feedback management
- Analytics

**Access**: Users with "mentor" role

### Admin Dashboard

**Features**:
- User management
- System settings
- Audit logs
- Platform monitoring
- Role assignments

**Access**: Users with "admin" role

### Program Director Dashboard

**Features**:
- Cohort management
- Program oversight
- Budget tracking
- Performance reports
- Resource allocation

**Access**: Users with "program_director" role

### Analyst Dashboard

**Features**:
- Data analysis
- Report generation
- Insights discovery
- Query execution
- Export capabilities

**Access**: Users with "analyst" role

## Navigation Flow

### Landing Page Navigation

**Platform Dropdown**:
- Features
- Pricing
- Security

**Get Started Dropdown**:
- As Student
- As Mentor
- As Director

**Sign In Dropdown**:
- Student Portal
- Mentor Portal
- Admin Portal

### Dashboard Navigation

**Role Switcher** (if multiple roles):
- Display current role
- Show available roles
- Allow switching between roles

**Quick Links**:
- Profile Settings
- Analytics (if permitted)
- Logout

## Implementation Details

### URL Parameters

- `persona`: Role identifier (student, mentor, admin, etc.)
- `registered`: Boolean flag after signup
- `redirect`: URL to redirect after login

### Token Storage

- **Access Token**: localStorage (15 min lifetime)
- **Refresh Token**: HttpOnly cookie + localStorage (30 days)
- **User Data**: Retrieved from `/api/v1/auth/me`

### Role Checking

```typescript
// In dashboard components
const { user } = useAuth();
const hasRole = user?.roles?.some(r => r.role === 'mentor');

if (!hasRole) {
  redirect('/dashboard/student');
}
```

## Error Handling

### Invalid Persona

- Default to "student" persona
- Show warning message
- Allow persona selection

### Missing Role

- Redirect to default dashboard
- Show access denied message
- Suggest contacting admin

### Token Expired

- Automatic refresh attempt
- If refresh fails, redirect to login
- Preserve redirect URL

## Security Considerations

1. **Role Verification**: Always verify roles server-side
2. **Token Validation**: Validate JWT on every request
3. **Route Protection**: Middleware checks authentication
4. **SSO Security**: Verify provider tokens before user creation
5. **Default Role**: All users start as "Mentee" (per specification)



