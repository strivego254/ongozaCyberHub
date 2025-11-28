# Ongoza CyberHub Frontend

## Overview

Next.js 14 frontend application for Ongoza CyberHub platform, featuring role-based dashboards, OCH brand design system, and comprehensive authentication flows.

## OCH Brand Design System

### Colors

- **OCH Midnight** (`#0A0A0C`): Primary background
- **Defender Blue** (`#0648A8`): Primary actions
- **Cyber Mint** (`#33FFC1`): Accents, success states
- **Sahara Gold** (`#C89C15`): Leadership, premium
- **Signal Orange** (`#F55F28`): Warnings, alerts
- **Steel Grey** (`#A8B0B8`): Secondary text, borders

### Typography

- **Font**: Inter (Google Fonts)
- **Headings**: Bold, tight letter spacing (-0.02em to -0.03em)
- **Body**: 16px default, normal weight

### Components

Located in `/components/ui/`:
- `Button`: Primary, secondary, mint, warning, ghost variants
- `Card`: Blue, mint, gold, orange variants with glow effects
- `Badge`: Beginner, intermediate, advanced, mastery, vip
- `ProgressBar`: Blue, mint, gold variants

## Setup Instructions

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

```bash
cd frontend/nextjs_app
npm install
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_API_URL=http://localhost:8001
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

Application runs on `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

## Role-Based Dashboards

### Available Dashboards

- **Student**: `/dashboard/student`
- **Mentor**: `/dashboard/mentor`
- **Admin**: `/dashboard/admin`
- **Program Director**: `/dashboard/director`
- **Analyst**: `/dashboard/analyst`
- **Analytics**: `/dashboard/analytics` (ISR, 60s cache)

### Dashboard Structure

Each dashboard follows this pattern:

```
/app/dashboard/{role}/
  ├── page.tsx          # Server component (metadata)
  └── {role}-client.tsx # Client component (UI)
```

### Features

- **KPIs**: Top metrics cards
- **Action Shortcuts**: Quick action buttons
- **Progress Tracking**: Progress bars and status
- **Analytics Placeholders**: Data visualization areas

## Authentication

### Login Flow

1. Navigate to `/login?persona={role}`
2. Enter email and password
3. Optional: Use SSO (Google, Microsoft, Apple, Okta)
4. Tokens stored in localStorage and cookies
5. Redirect to `/dashboard`

### Signup Flow

1. Navigate to `/signup?persona={role}`
2. Fill in registration form
3. Submit creates account
4. Default "Mentee" role assigned
5. Redirect to login

### Token Management

- **Access Token**: 15 minutes, stored in localStorage
- **Refresh Token**: 30 days, HttpOnly cookie
- **Auto Refresh**: Automatic on 401 errors

### Dev Authentication

For development, use test users:

```bash
# In Django backend
python manage.py create_test_users
```

Test credentials:
- Email: `student@test.com`
- Password: `testpass123`

## File Structure

```
nextjs_app/
├── app/                    # Next.js App Router
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   ├── dashboard/          # Dashboards
│   │   ├── student/
│   │   ├── mentor/
│   │   ├── admin/
│   │   ├── director/
│   │   ├── analyst/
│   │   └── analytics/
│   └── api/                # API routes
├── components/
│   └── ui/                 # Design system components
├── hooks/                  # React hooks
├── services/               # API clients
├── utils/                  # Utilities
└── tailwind.config.ts      # Tailwind + OCH config
```

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm run format       # Prettier format
```

## Landing Pages

Separate Express.js application in `/frontend/landing_pages/`:

```bash
cd frontend/landing_pages
npm install
node server.js
```

Runs on `http://localhost:3001`

## Design System Usage

### Colors

```tsx
<div className="bg-och-midnight text-cyber-mint border-defender-blue">
```

### Typography

```tsx
<h1 className="text-h1">Heading</h1>
<p className="text-body-m">Body text</p>
```

### Components

```tsx
<Button variant="primary" size="md" glow>Click</Button>
<Card variant="blue" hover>Content</Card>
<Badge variant="advanced">Badge</Badge>
<ProgressBar value={75} variant="mint" />
```

## API Integration

### Django Client

Located in `/services/djangoClient.ts`:

```typescript
import { djangoClient } from '@/services/djangoClient';

// Login
await djangoClient.auth.login({ email, password });

// Get user
const user = await djangoClient.auth.getCurrentUser();

// SSO Login
await djangoClient.auth.ssoLogin('google', { id_token, ... });
```

### API Gateway

Located in `/services/apiGateway.ts`:

- Automatic token injection
- Token refresh on 401
- Error handling
- Type safety

## Development Authentication

### Test Users

Created via Django management command:

- `admin@test.com` (admin)
- `student@test.com` (student)
- `mentor@test.com` (mentor)
- `director@test.com` (program_director)
- `sponsor@test.com` (sponsor_admin)
- `analyst@test.com` (analyst)

All passwords: `testpass123`

### Default Role

All new signups receive "Mentee" role automatically.

## Documentation

- **Style Guide**: `/docs/STYLE_GUIDE.md`
- **Persona Flows**: `/docs/PERSONA_FLOWS.md`
- **Architecture**: `/docs/FRONTEND_ARCHITECTURE.md`
- **Navigation**: `/docs/NAVIGATION_DESIGN.md`

## Troubleshooting

### 401 Unauthorized

- Check token in localStorage
- Verify token not expired
- Try logging in again
- Check network tab for API errors

### Dashboard Not Loading

- Verify user has required role
- Check `/api/v1/auth/me` response
- Review browser console for errors

### SSO Not Working

- Verify SSO provider credentials
- Check OAuth redirect URIs
- Review network requests

## Next Steps

1. Implement Recharts for analytics
2. Add form validation (React Hook Form)
3. Enhance animations (Framer Motion)
4. Add E2E tests
5. Optimize bundle size
