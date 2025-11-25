# Authentication Flow Documentation

## Overview

The authentication system uses JWT tokens (access + refresh) stored in HttpOnly cookies for security. Authentication flows differ between client-side and server-side rendering.

## Authentication Architecture

```
┌─────────────┐
│   Client    │
│  Component  │
└──────┬──────┘
       │
       ├─► POST /api/auth/login (Next.js API Route)
       │       │
       │       └─► Django /api/v1/auth/login
       │               │
       │               └─► Returns: { access_token, refresh_token, user }
       │                       │
       │                       └─► Next.js sets HttpOnly cookies
       │                               │
       │                               └─► Returns: { user } (no tokens)
       │
       └─► GET /api/v1/auth/me
               │
               └─► apiGateway adds Authorization header from cookie
                       │
                       └─► Django validates token
                               │
                               └─► Returns: { user }
```

## Login Flow

### 1. User Submits Credentials

```typescript
// Client component
const { login } = useAuth();
await login({
  email: 'user@example.com',
  password: 'password123',
  device_fingerprint: 'device-123',
});
```

### 2. Hook Calls Next.js API Route

```typescript
// hooks/useAuth.ts
const login = async (credentials: LoginRequest) => {
  // Call Next.js API route (not Django directly)
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  
  const { user } = await response.json();
  // Tokens are set in HttpOnly cookies by API route
};
```

### 3. API Route Calls Django

```typescript
// app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Call Django API
  const response = await djangoClient.auth.login(body);
  // Returns: { access_token, refresh_token, user }
  
  // Set HttpOnly cookies (server-side)
  await setServerAuthTokens(
    response.access_token,
    response.refresh_token
  );
  
  // Return user only (tokens in cookies)
  return NextResponse.json({ user: response.user });
}
```

### 4. Cookies Set

```typescript
// utils/auth-server.ts
cookieStore.set('access_token', accessToken, {
  httpOnly: true,  // Not accessible via JavaScript
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 15, // 15 minutes
  path: '/',
});

cookieStore.set('refresh_token', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
});
```

## Authenticated Requests

### Client-Side (CSR)

```typescript
// Component makes request
const user = await djangoClient.auth.getCurrentUser();

// apiGateway automatically adds token from cookie
// utils/fetcher.ts
function getAuthToken(): string | null {
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('access_token='));
  return tokenCookie?.split('=')[1] || null;
}

// Add to headers
headers['Authorization'] = `Bearer ${token}`;
```

### Server-Side (SSR)

```typescript
// Server component
async function getOrganizations() {
  const headers = await getServerAuthHeaders();
  // Returns: { Authorization: 'Bearer <token>' }
  
  // Use in fetch
  const response = await fetch(url, { headers });
}
```

## Token Refresh Flow

### Automatic Refresh

```typescript
// apiGateway.ts
async function apiGatewayRequest<T>(path: string, options: FetchOptions) {
  try {
    return await fetcher<T>(fullUrl, options);
  } catch (error) {
    // If 401 and we have refresh token
    if (isUnauthorizedError(error) && getRefreshToken() && !options.skipAuth) {
      // Attempt refresh
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        // Retry original request
        return await fetcher<T>(fullUrl, options);
      }
    }
    throw error;
  }
}
```

### Refresh Process

1. **Detect 401 error**
2. **Get refresh token** from cookie
3. **Call refresh endpoint**
   ```typescript
   POST /api/v1/auth/token/refresh
   Body: { refresh_token: "..." }
   ```
4. **Update cookies** with new tokens
5. **Retry original request**

## Logout Flow

### 1. Client Calls Logout

```typescript
const { logout } = useAuth();
await logout();
```

### 2. API Route Invalidates Session

```typescript
// app/api/auth/logout/route.ts
export async function POST(request: NextRequest) {
  const refreshToken = await getServerRefreshToken();
  
  if (refreshToken) {
    // Call Django to invalidate session
    await djangoClient.auth.logout(refreshToken);
  }
  
  // Clear cookies
  await clearServerAuthTokens();
  
  return NextResponse.json({ success: true });
}
```

### 3. Cookies Cleared

```typescript
cookieStore.delete('access_token');
cookieStore.delete('refresh_token');
```

## Protected Routes

### Middleware Protection

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;
  
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Redirect to login if no token
  if (isProtectedRoute && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

### Component-Level Protection

```typescript
// Server component
export default async function ProtectedPage() {
  const isAuth = await isServerAuthenticated();
  
  if (!isAuth) {
    redirect('/login');
  }
  
  // Render protected content
}
```

## Token Storage

### HttpOnly Cookies (Recommended)

**Pros:**
- Not accessible via JavaScript (XSS protection)
- Automatically sent with requests
- Can be set server-side

**Cons:**
- Requires API routes for login/logout
- Slightly more complex setup

### localStorage (Fallback)

**Pros:**
- Simple to use
- Works client-side only

**Cons:**
- Vulnerable to XSS attacks
- Not sent automatically
- Not available server-side

**Current Implementation:**
- Primary: HttpOnly cookies (set via API routes)
- Fallback: localStorage (for client-side access)

## Security Considerations

### 1. HttpOnly Cookies

Tokens stored in HttpOnly cookies cannot be accessed by JavaScript, preventing XSS attacks.

### 2. Secure Flag

In production, cookies use `secure: true` to only send over HTTPS.

### 3. SameSite Policy

`sameSite: 'lax'` prevents CSRF attacks while allowing normal navigation.

### 4. Token Expiration

- **Access token:** 15 minutes (short-lived)
- **Refresh token:** 30 days (long-lived, can be revoked)

### 5. Automatic Refresh

Tokens are automatically refreshed before expiration, providing seamless user experience.

## Error Handling

### Invalid Token

```typescript
try {
  const user = await djangoClient.auth.getCurrentUser();
} catch (error) {
  if (error instanceof ApiError && error.status === 401) {
    // Token invalid - redirect to login
    router.push('/login');
  }
}
```

### Refresh Failed

```typescript
// If refresh fails, clear tokens and redirect
clearAuthTokens();
router.push('/login');
```

## Best Practices

1. **Use API routes for login/logout** - Set HttpOnly cookies server-side
2. **Let gateway handle refresh** - Don't manually refresh tokens
3. **Check authentication server-side** - For SSR pages
4. **Handle errors gracefully** - Show user-friendly messages
5. **Clear tokens on logout** - Both client and server
6. **Use middleware for route protection** - Centralized auth checks

## Testing Authentication

### Test Login

```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
  }),
});

const { user } = await response.json();
// Cookies are set automatically
```

### Test Authenticated Request

```typescript
// Cookies are sent automatically
const user = await djangoClient.auth.getCurrentUser();
```

### Test Logout

```typescript
await fetch('/api/auth/logout', { method: 'POST' });
// Cookies are cleared automatically
```

