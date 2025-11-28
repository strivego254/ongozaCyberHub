# Frontend API Integration Guide

## Overview

The frontend consists of two applications:
1. **Next.js App** (`/frontend/nextjs_app`) - Authenticated dashboard and user interface
2. **Node.js Landing Pages** (`/frontend/landing_pages`) - Static marketing pages

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│   (Port 3000)   │
└────────┬────────┘
         │
         ├───► Django API (Port 8000) - CRUD, Auth, Business Logic
         │
         └───► FastAPI (Port 8001) - AI, Recommendations, Embeddings

┌─────────────────┐
│ Node.js Landing │
│  (Port 3001)    │
└────────┬────────┘
         │
         └───► Django API (Port 8000) - Public Data Only
```

## Next.js Communication with Backends

### Django Backend

**Purpose:** User management, authentication, organizations, progress tracking

**Base URL:** `http://localhost:8000/api/v1`

**Key Endpoints:**
- `/auth/*` - Authentication (login, signup, refresh, logout)
- `/users/*` - User management
- `/orgs/*` - Organization management
- `/progress/*` - Progress tracking
- `/roles/*` - Role management
- `/api-keys/*` - API key management
- `/audit-logs/*` - Audit logs

**Usage:**
```typescript
import { djangoClient } from '@/services/djangoClient';

// Get current user
const user = await djangoClient.auth.getCurrentUser();

// List organizations
const orgs = await djangoClient.organizations.listOrganizations();

// Create progress record
const progress = await djangoClient.progress.createProgress({
  content_type: 'course',
  content_id: 'course-123',
  status: 'completed',
});
```

### FastAPI Backend

**Purpose:** AI-powered recommendations, personality analysis, embeddings

**Base URL:** `http://localhost:8001/api/v1`

**Key Endpoints:**
- `/recommendations` - Get personalized recommendations
- `/personality/analyze` - Analyze user personality
- `/embeddings` - Generate/store/search embeddings

**Usage:**
```typescript
import { fastapiClient } from '@/services/fastapiClient';

// Get recommendations
const recommendations = await fastapiClient.recommendations.getRecommendations({
  user_id: 1,
  limit: 10,
});

// Analyze personality
const analysis = await fastapiClient.personality.analyzePersonality({
  user_id: 1,
});
```

## Node.js Landing Pages Communication

**Purpose:** Fetch public API data for marketing pages

**Base URL:** `http://localhost:8000/api/v1`

**Usage:**
```javascript
const axios = require('axios');
const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';

// Fetch public data (no auth required)
const stats = await axios.get(`${DJANGO_API_URL}/api/v1/health`);
```

## API Gateway

All API calls go through `apiGateway.ts` which:
1. Routes requests to Django or FastAPI based on path patterns
2. Handles authentication tokens automatically
3. Implements automatic token refresh on 401 errors
4. Provides consistent error handling

**Path Routing:**
- `/recommendations`, `/embeddings`, `/personality`, `/ai/*` → FastAPI
- Everything else → Django

**Example:**
```typescript
import { apiGateway } from '@/services/apiGateway';

// Automatically routes to Django
const user = await apiGateway.get('/auth/me');

// Automatically routes to FastAPI
const recs = await apiGateway.post('/recommendations', { user_id: 1 });
```

## Authentication Flow

### 1. Login
```typescript
// Client calls Next.js API route
POST /api/auth/login
  → Next.js API route calls Django
  → Django returns tokens
  → Next.js sets HttpOnly cookies
  → Returns user data (without tokens)
```

### 2. Authenticated Requests
```typescript
// Client makes request
GET /api/v1/auth/me
  → apiGateway adds Authorization header from cookie
  → Django validates token
  → Returns user data
```

### 3. Token Refresh
```typescript
// On 401 error
  → apiGateway detects 401
  → Calls refresh endpoint with refresh token
  → Updates cookies with new tokens
  → Retries original request
```

## Adding New Endpoints

### 1. Add TypeScript Types

Update `/services/types/` files to match backend schemas:

```typescript
// services/types/user.ts
export interface NewFeature {
  id: number;
  name: string;
  // ... match Django serializer or FastAPI Pydantic model
}
```

### 2. Add Client Function

**For Django:**
```typescript
// services/djangoClient.ts
export const djangoClient = {
  // ... existing
  newFeature: {
    async getFeature(id: number): Promise<NewFeature> {
      return apiGateway.get(`/new-feature/${id}`);
    },
  },
};
```

**For FastAPI:**
```typescript
// services/fastapiClient.ts
export const fastapiClient = {
  // ... existing
  newFeature: {
    async processFeature(data: ProcessRequest): Promise<ProcessResponse> {
      return apiGateway.post('/ai/new-feature', data);
    },
  },
};
```

### 3. Use in Components

```typescript
// In component or hook
import { djangoClient } from '@/services/djangoClient';

const feature = await djangoClient.newFeature.getFeature(1);
```

## Error Handling

All API errors are wrapped in `ApiError` class:

```typescript
import { ApiError } from '@/utils/fetcher';

try {
  const data = await djangoClient.users.getUser(1);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Data:', error.data);
  }
}
```

## Fetch Conventions

### GET Requests
```typescript
// Simple GET
const data = await apiGateway.get('/endpoint');

// With query params
const data = await apiGateway.get('/endpoint', {
  params: { page: 1, limit: 10 },
});
```

### POST Requests
```typescript
const data = await apiGateway.post('/endpoint', {
  field1: 'value1',
  field2: 'value2',
});
```

### PATCH/PUT Requests
```typescript
const data = await apiGateway.patch('/endpoint/1', {
  field1: 'updated',
});
```

### DELETE Requests
```typescript
await apiGateway.delete('/endpoint/1');
```

## Retry Logic

The API gateway automatically retries failed requests after token refresh:

1. Request fails with 401
2. Gateway attempts token refresh
3. If refresh succeeds, retry original request
4. If refresh fails, clear tokens and redirect to login

## Environment Variables

```env
# Next.js App
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_API_URL=http://localhost:8001

# Node.js Landing Pages
DJANGO_API_URL=http://localhost:8000
PORT=3001
```

## Best Practices

1. **Always use typed clients** (`djangoClient`, `fastapiClient`) instead of direct `apiGateway` calls
2. **Handle errors gracefully** - Show user-friendly messages
3. **Use SSR for initial data** - Fetch server-side when possible
4. **Use CSR for mutations** - Update UI optimistically
5. **Cache responses** - Use React Query or SWR for client-side caching
6. **Validate data** - Use Zod schemas for runtime validation

## Testing

See `SETUP_AND_TESTING.md` in backend for API endpoint testing.

For frontend testing:
```bash
# Test Next.js app
cd frontend/nextjs_app
npm run dev

# Test landing pages
cd frontend/landing_pages
npm run dev
```

