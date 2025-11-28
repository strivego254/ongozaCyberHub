# Frontend Architecture Documentation

## Overview

Ongoza CyberHub frontend is built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. The architecture follows a component-based, role-driven design system.

## File Structure

```
frontend/
├── landing_pages/              # EJS-based landing pages
│   ├── views/
│   │   └── index.ejs           # Main landing page
│   ├── public/
│   │   └── css/
│   │       └── style.css       # Landing page styles
│   └── server.js               # Express server
│
└── nextjs_app/                 # Next.js application
    ├── app/                    # App Router directory
    │   ├── login/              # Login page
    │   │   └── page.tsx
    │   ├── signup/             # Signup page
    │   │   └── page.tsx
    │   ├── dashboard/          # Dashboard pages
    │   │   ├── page.tsx        # Dashboard router (redirects)
    │   │   ├── student/        # Student dashboard
    │   │   │   ├── page.tsx
    │   │   │   └── student-client.tsx
    │   │   ├── mentor/         # Mentor dashboard
    │   │   │   ├── page.tsx
    │   │   │   └── mentor-client.tsx
    │   │   ├── admin/          # Admin dashboard
    │   │   │   ├── page.tsx
    │   │   │   └── admin-client.tsx
    │   │   ├── director/        # Program Director dashboard
    │   │   │   ├── page.tsx
    │   │   │   └── director-client.tsx
    │   │   ├── analyst/        # Analyst dashboard
    │   │   │   ├── page.tsx
    │   │   │   └── analyst-client.tsx
    │   │   └── analytics/      # Analytics page
    │   │       ├── page.tsx    # Server component (ISR)
    │   │       └── analytics-client.tsx
    │   ├── api/                 # API routes
    │   │   └── auth/
    │   │       ├── login/
    │   │       │   └── route.ts
    │   │       └── logout/
    │   │           └── route.ts
    │   ├── globals.css          # Global styles + OCH design system
    │   ├── layout.tsx           # Root layout
    │   └── page.tsx             # Home page
    │
    ├── components/
    │   ├── ui/                  # Design system components
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── Badge.tsx
    │   │   └── ProgressBar.tsx
    │   └── SSOButtons.tsx       # SSO provider buttons
    │
    ├── hooks/
    │   └── useAuth.ts           # Authentication hook
    │
    ├── services/
    │   ├── djangoClient.ts     # Django API client
    │   └── types/
    │       └── index.ts         # TypeScript types
    │
    ├── utils/
    │   ├── auth.ts              # Client-side auth utilities
    │   ├── auth-server.ts       # Server-side auth utilities
    │   └── fetcher.ts           # Fetch wrapper with auth
    │
    ├── tailwind.config.ts       # Tailwind + OCH config
    ├── middleware.ts            # Next.js middleware
    ├── next.config.js           # Next.js configuration
    └── package.json
```

## Architecture Patterns

### 1. Server/Client Component Split

**Server Components** (`page.tsx`):
- Handle metadata
- Data fetching (if needed)
- ISR configuration
- Redirect logic

**Client Components** (`*-client.tsx`):
- Interactive UI
- State management
- Event handlers
- Real-time updates

**Example**:
```tsx
// page.tsx (Server)
export const revalidate = 60;
export default function AnalyticsPage() {
  return <AnalyticsClient />;
}

// analytics-client.tsx (Client)
'use client';
export default function AnalyticsClient() {
  // Interactive logic here
}
```

### 2. Design System Components

**Location**: `/components/ui/`

**Components**:
- `Button`: Variants (primary, secondary, mint, warning, ghost)
- `Card`: Variants (default, blue, mint, gold, orange)
- `Badge`: Variants (beginner, intermediate, advanced, mastery, vip)
- `ProgressBar`: Variants (blue, mint, gold)

**Usage**:
```tsx
<Button variant="primary" size="md" glow>
  Click Me
</Button>

<Card variant="blue" hover>
  Content
</Card>
```

### 3. Authentication Flow

**Client-Side**:
- `useAuth` hook manages auth state
- Tokens stored in localStorage
- Automatic token refresh on 401

**Server-Side**:
- API routes handle login/logout
- HttpOnly cookies for refresh tokens
- Server-side token validation

**Middleware**:
- Route protection
- Token validation
- Redirect logic

### 4. Dashboard Rendering

**Structure**:
```
/dashboard/{role}/
  ├── page.tsx          # Server component (metadata, redirects)
  └── {role}-client.tsx # Client component (UI, interactions)
```

**Role Detection**:
- Read from user.roles array
- Default to first role
- Allow role switching

**Data Fetching**:
- Client-side: `useAuth` hook
- Server-side: Direct API calls (if needed)
- ISR: Analytics page (60s revalidation)

### 5. Theming System

**Tailwind Config**:
- OCH color tokens
- Custom gradients
- Typography scale
- Spacing system

**Global CSS**:
- CSS variables
- Utility classes
- Animations
- Component styles

**Component Theming**:
- Variant props
- Color system integration
- Consistent spacing

## Data Flow

### Authentication

1. User submits login form
2. POST to `/api/auth/login` (Next.js API route)
3. Next.js route calls Django API
4. Tokens returned and stored
5. User redirected to dashboard
6. Dashboard fetches user data via `useAuth`

### Dashboard Data

1. Client component mounts
2. `useAuth` hook loads user data
3. User data includes roles
4. Dashboard renders based on roles
5. Additional data fetched as needed

### API Communication

**Pattern**:
```
Component → djangoClient → apiGateway → fetcher → Django API
```

**Features**:
- Automatic token injection
- Token refresh on 401
- Error handling
- Type safety

## State Management

### Local State

- React `useState` for component state
- `useAuth` hook for auth state
- No global state management (Redux/Zustand)

### Server State

- Next.js Server Components for initial data
- Client-side fetching for updates
- ISR for cached data (analytics)

## Routing

### App Router Structure

- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - Dashboard router (redirects)
- `/dashboard/{role}` - Role-specific dashboards
- `/dashboard/analytics` - Analytics page

### Dynamic Routing

- Persona-based: `?persona={role}`
- Redirect preservation: `?redirect={url}`
- Query params for state

## Styling System

### Tailwind + OCH

**Colors**:
```tsx
bg-och-midnight
text-defender-blue
border-cyber-mint
```

**Utilities**:
```tsx
text-h1, text-h2, text-h3
text-body-l, text-body-m, text-body-s
card, btn-primary, badge-beginner
```

### CSS Variables

```css
var(--och-midnight)
var(--defender-blue)
var(--cyber-mint)
```

### Component Variants

Props-based styling:
```tsx
<Button variant="primary" />
<Card variant="blue" glow />
<Badge variant="advanced" />
```

## Performance

### Optimization

- **ISR**: Analytics page (60s)
- **Code Splitting**: Automatic via Next.js
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Google Fonts with display=swap

### Caching

- Static pages: Build-time
- ISR pages: 60s revalidation
- API responses: Client-side caching

## Security

### Token Management

- Access token: localStorage (short-lived)
- Refresh token: HttpOnly cookie (long-lived)
- Automatic refresh on expiry
- Secure token storage

### Route Protection

- Middleware checks authentication
- Server-side role verification
- Client-side role checks
- API-level authorization

## Development Workflow

### Local Development

1. Start Next.js: `npm run dev`
2. Start Landing Pages: `node server.js`
3. Connect to Django API (port 8000)
4. Connect to FastAPI (port 8001)

### Build Process

1. Type checking: `npm run type-check`
2. Linting: `npm run lint`
3. Build: `npm run build`
4. Start: `npm start`

## Testing Strategy

### Component Testing

- Unit tests for UI components
- Integration tests for flows
- E2E tests for critical paths

### Authentication Testing

- Login flow
- Token refresh
- Role-based access
- SSO flows

## Future Enhancements

1. **State Management**: Consider Zustand for complex state
2. **Data Fetching**: React Query for server state
3. **Forms**: React Hook Form integration
4. **Charts**: Recharts implementation
5. **Animations**: Framer Motion for transitions



