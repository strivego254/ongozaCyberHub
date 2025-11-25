# Frontend Architecture

## Overview

The frontend consists of two applications:

1. **Next.js App** (`/nextjs_app`) - Authenticated dashboard and user interface
2. **Node.js Landing Pages** (`/landing_pages`) - Static marketing pages

## Quick Start

### Next.js App

```bash
cd nextjs_app
npm install
npm run dev
```

Server runs on http://localhost:3000

### Landing Pages

```bash
cd landing_pages
npm install
npm run dev
```

Server runs on http://localhost:3001

## Architecture

```
┌─────────────────┐
│   Next.js App   │───► Django API (Port 8000)
│   (Port 3000)   │───► FastAPI (Port 8001)
└─────────────────┘

┌─────────────────┐
│ Node.js Landing │───► Django API (Public endpoints)
│  (Port 3001)    │
└─────────────────┘
```

## Key Features

### Next.js App

- ✅ Type-safe API clients (Django + FastAPI)
- ✅ Unified API gateway with automatic routing
- ✅ JWT authentication with HttpOnly cookies
- ✅ Automatic token refresh
- ✅ SSR/CSR/ISR data fetching patterns
- ✅ Protected routes with middleware
- ✅ Shared TypeScript types

### Landing Pages

- ✅ Server-side rendered marketing pages
- ✅ Public API data fetching
- ✅ SEO-optimized
- ✅ No authentication required

## Documentation

- **[API Integration Guide](../docs/frontend_api_integration.md)** - How Next.js communicates with backends
- **[API Gateway Logic](../docs/api_gateway_logic.md)** - Internal routing and token handling
- **[Shared Types](../docs/shared_types.md)** - TypeScript type system
- **[Authentication Flow](../docs/auth_flow.md)** - Complete auth flow documentation
- **[Fetch Strategies](../docs/fetch_strategies.md)** - SSR/CSR/ISR patterns

## Folder Structure

```
frontend/
├── nextjs_app/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # Next.js API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── login/             # Auth pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts         # Authentication hook
│   │   ├── useUser.ts         # User data hook
│   │   └── ...
│   ├── services/              # API clients
│   │   ├── apiGateway.ts      # Unified API gateway
│   │   ├── djangoClient.ts   # Django API client
│   │   ├── fastapiClient.ts  # FastAPI client
│   │   └── types/            # TypeScript types
│   ├── utils/                 # Utilities
│   │   ├── auth.ts           # Client auth utils
│   │   ├── auth-server.ts    # Server auth utils
│   │   └── fetcher.ts        # Fetch wrapper
│   └── middleware.ts          # Next.js middleware
│
└── landing_pages/             # Node.js Express app
    ├── server.js              # Express server
    ├── views/                 # EJS templates
    ├── routes/                # Route handlers
    └── public/                # Static assets
```

## Environment Variables

### Next.js App

Create `.env.local`:

```env
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_API_URL=http://localhost:8001
```

### Landing Pages

Create `.env`:

```env
DJANGO_API_URL=http://localhost:8000
PORT=3001
NODE_ENV=development
```

## Usage Examples

### Authenticated Request (Django)

```typescript
import { djangoClient } from '@/services/djangoClient';

const user = await djangoClient.auth.getCurrentUser();
const orgs = await djangoClient.organizations.listOrganizations();
```

### AI Request (FastAPI)

```typescript
import { fastapiClient } from '@/services/fastapiClient';

const recommendations = await fastapiClient.recommendations.getRecommendations({
  user_id: 1,
  limit: 10,
});
```

### Authentication Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

function Component() {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }
  
  return <Dashboard user={user} onLogout={logout} />;
}
```

## Development

### Type Checking

```bash
cd nextjs_app
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Testing

See backend `SETUP_AND_TESTING.md` for API endpoint testing.

For frontend integration testing:
1. Start Django backend: `cd backend/django_app && python manage.py runserver`
2. Start FastAPI backend: `cd backend/fastapi_app && uvicorn main:app --reload`
3. Start Next.js app: `cd frontend/nextjs_app && npm run dev`
4. Test endpoints using browser or API client

## Next Steps

1. Implement email templates for auth flows
2. Add React Query for advanced caching
3. Implement error boundaries
4. Add loading skeletons
5. Create more dashboard pages
6. Add analytics tracking

