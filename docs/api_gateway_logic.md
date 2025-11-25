# API Gateway Logic

## Overview

The API Gateway (`services/apiGateway.ts`) is a unified interface for all backend API calls. It handles routing, authentication, error handling, and token refresh automatically.

## Internal Routing Logic

### Path-Based Routing

The gateway determines which backend to call based on URL path patterns:

```typescript
function getBaseUrl(path: string): string {
  // FastAPI routes (AI, recommendations, embeddings, personality)
  const fastApiPaths = [
    '/recommendations',
    '/embeddings',
    '/personality',
    '/ai/',
  ];

  const isFastApi = fastApiPaths.some(prefix => path.startsWith(prefix));

  if (isFastApi) {
    return `${FASTAPI_API_URL}/api/v1`;
  }

  // Default to Django
  return `${DJANGO_API_URL}/api/v1`;
}
```

### Routing Examples

| Path | Backend | Full URL |
|------|---------|----------|
| `/auth/login` | Django | `http://localhost:8000/api/v1/auth/login` |
| `/users/1` | Django | `http://localhost:8000/api/v1/users/1` |
| `/recommendations` | FastAPI | `http://localhost:8001/api/v1/recommendations` |
| `/embeddings` | FastAPI | `http://localhost:8001/api/v1/embeddings` |
| `/personality/analyze` | FastAPI | `http://localhost:8001/api/v1/personality/analyze` |

## Token Injection

### Client-Side (CSR)

Tokens are read from cookies or localStorage:

```typescript
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null; // SSR handled separately
  }
  
  // Try cookies first (preferred)
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('access_token='));
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }
  
  // Fallback to localStorage
  return localStorage.getItem('access_token');
}
```

### Server-Side (SSR)

Tokens are read from HttpOnly cookies:

```typescript
// utils/auth-server.ts
export async function getServerAuthHeaders(): Promise<HeadersInit> {
  const token = await getServerAccessToken();
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}
```

## Automatic Token Refresh

### Flow

1. **Request fails with 401**
   ```typescript
   if (isUnauthorizedError(error) && getRefreshToken() && !options.skipAuth) {
     // Attempt refresh
   }
   ```

2. **Refresh token**
   ```typescript
   const response = await fetcher<RefreshTokenResponse>(
     `${DJANGO_API_URL}/api/v1/auth/token/refresh`,
     {
       method: 'POST',
       body: JSON.stringify({ refresh_token: refreshToken }),
       skipAuth: true,
     }
   );
   ```

3. **Update tokens**
   ```typescript
   if (response.access_token && response.refresh_token) {
     setAuthTokens(response.access_token, response.refresh_token);
     return response.access_token;
   }
   ```

4. **Retry original request**
   ```typescript
   if (newAccessToken) {
     return await fetcher<T>(fullUrl, options);
   }
   ```

### Skip Auth Option

Some endpoints don't require authentication:

```typescript
// Login endpoint
await apiGateway.post('/auth/login', data, { skipAuth: true });

// Signup endpoint
await apiGateway.post('/auth/signup', data, { skipAuth: true });
```

## FastAPI vs Django Path Mapping

### FastAPI Routes

These paths automatically route to FastAPI:

- `/recommendations` - Get recommendations
- `/recommendations/*` - Recommendation operations
- `/embeddings` - Embedding operations
- `/embeddings/*` - Embedding sub-routes
- `/personality` - Personality analysis
- `/personality/*` - Personality sub-routes
- `/ai/*` - Any AI-related endpoints

### Django Routes

Everything else routes to Django:

- `/auth/*` - Authentication
- `/users/*` - User management
- `/orgs/*` - Organizations
- `/progress/*` - Progress tracking
- `/roles/*` - Roles
- `/api-keys/*` - API keys
- `/audit-logs/*` - Audit logs

## Error Handling

### ApiError Class

All errors are wrapped in `ApiError`:

```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}
```

### Error Flow

1. **Network error** → `ApiError` with status 0
2. **HTTP error** → `ApiError` with status code
3. **JSON error** → `ApiError` with parsed error data
4. **401 error** → Automatic token refresh attempt

## Request Flow Diagram

```
Client Component
    │
    ├─► apiGateway.get('/auth/me')
    │       │
    │       ├─► getBaseUrl('/auth/me') → Django
    │       ├─► getAuthToken() → From cookie/localStorage
    │       ├─► Add Authorization header
    │       └─► fetch(Django URL)
    │               │
    │               ├─► Success → Return data
    │               │
    │               └─► 401 Error
    │                       │
    │                       ├─► refreshAccessToken()
    │                       │       │
    │                       │       └─► Success → Retry request
    │                       │       └─► Fail → Clear tokens, throw error
    │
    └─► apiGateway.post('/recommendations', data)
            │
            ├─► getBaseUrl('/recommendations') → FastAPI
            ├─► getAuthToken() → From cookie/localStorage
            ├─► Add Authorization header
            └─► fetch(FastAPI URL)
                    │
                    └─► Success → Return recommendations
```

## Adding New Routes

### Add FastAPI Route

1. Add path pattern to `fastApiPaths` array:
   ```typescript
   const fastApiPaths = [
     '/recommendations',
     '/embeddings',
     '/personality',
     '/ai/',
     '/new-ai-feature', // Add here
   ];
   ```

2. Use in client:
   ```typescript
   await apiGateway.post('/new-ai-feature', data);
   ```

### Add Django Route

No changes needed - all non-FastAPI paths route to Django automatically:

```typescript
await apiGateway.get('/new-django-feature');
```

## Configuration

Environment variables control backend URLs:

```env
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_API_URL=http://localhost:8001
```

These are read at build time and embedded in the client bundle.

## Best Practices

1. **Always use typed clients** - Don't call `apiGateway` directly
2. **Handle errors** - Check for `ApiError` instances
3. **Use skipAuth** - For public endpoints
4. **Let gateway handle refresh** - Don't manually refresh tokens
5. **Test routing** - Verify paths route to correct backend

## Debugging

Enable logging to see routing decisions:

```typescript
// In apiGateway.ts (development only)
if (process.env.NODE_ENV === 'development') {
  console.log(`Routing ${path} to ${baseUrl}`);
}
```

