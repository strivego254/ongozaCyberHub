# OCH Platform Frontend

A comprehensive role-based dashboard platform built with Next.js, Tailwind CSS, and the OCH brand design system.

## Project Overview

The OCH Platform provides personalized dashboards for five distinct personas:
- **Student**: Learning journey and mentorship tracking
- **Mentor**: Mentee management and session scheduling
- **Admin**: Platform operations and user management
- **Program Director**: Strategic oversight and program management
- **Analyst**: Data analysis and insights generation

## OCH Brand Design System

### Color Palette

- **Midnight** (`#0A0A0C`): Primary background
- **Defender** (`#0648A8`): Primary actions and trust
- **Mint** (`#33FFC1`): Accents and growth indicators
- **Gold** (`#C89C15`): Leadership and achievements
- **Orange** (`#F55F28`): Energy and urgency
- **Steel** (`#A8B0B8`): Neutral text and borders

### Typography

- **Font**: Inter (Google Fonts)
- **Headings**: Bold (700-800), tight letter spacing (-0.02 to -0.03em)
- **Body**: 16px default, 1.6 line height

### Design Features

- Dark-first design with Midnight background
- Gradient overlays (Defender and Leadership gradients)
- Glow and pulse animations for interactive elements
- Responsive grid layouts
- Accessible focus states and keyboard navigation

## File Structure

```
frontend/
├── landing_pages/           # EJS landing pages
│   ├── views/
│   │   └── index.ejs        # Main landing page
│   └── public/
│       └── css/
│           └── style.css    # Landing page styles
│
└── nextjs_app/              # Next.js application
    ├── app/                 # App Router pages
    │   ├── login/           # Login page
    │   ├── signup/          # Signup page
    │   └── dashboard/       # Role-based dashboards
    │       ├── student/
    │       ├── mentor/
    │       ├── admin/
    │       ├── director/
    │       ├── analyst/
    │       └── analytics/   # Analytics dashboard (ISR)
    │
    ├── components/
    │   └── ui/              # Reusable UI components
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       ├── Badge.tsx
    │       └── ProgressBar.tsx
    │
    ├── tailwind.config.ts   # Tailwind + OCH theme
    ├── app/globals.css      # Global styles
    └── package.json

docs/
├── STYLE_GUIDE.md           # Design system documentation
├── PERSONA_FLOWS.md        # Authentication and routing flows
├── FRONTEND_ARCHITECTURE.md # Technical architecture
└── NAVIGATION_DESIGN.md     # Navigation patterns
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- (Optional) EJS server for landing pages

### Next.js App Setup

1. Navigate to the Next.js app directory:
```bash
cd frontend/nextjs_app
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Landing Pages Setup

The landing pages use EJS templates. To serve them:

1. Set up an Express server (or similar) that:
   - Serves EJS templates from `frontend/landing_pages/views/`
   - Serves static files from `frontend/landing_pages/public/`
   - Routes `/` to `index.ejs`

2. Example Express setup:
```javascript
const express = require('express');
const path = require('path');
const app = express();

app.set('views', path.join(__dirname, 'frontend/landing_pages/views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'frontend/landing_pages/public')));

app.get('/', (req, res) => {
  res.render('index');
});

app.listen(3001, () => {
  console.log('Landing pages server running on port 3001');
});
```

## How Role-Based Dashboards Work

### Authentication Flow

1. **Login** (`/login`):
   - User enters email and password
   - Optional persona selection via badges
   - Redirects to selected persona dashboard (defaults to student)

2. **Signup** (`/signup`):
   - User enters email, password, and confirmation
   - **Required** persona selection
   - Redirects to selected persona dashboard

3. **Quick Access**:
   - Login page provides quick links to all persona dashboards
   - No authentication required in mock mode

### Dashboard Structure

Each dashboard (`/dashboard/{role}`) includes:

- **Top KPIs**: 4 key metrics with badges
- **Quick Actions**: Role-specific action buttons
- **Progress Tracking**: Visual progress indicators
- **Activity Feed**: Recent activities and events
- **Analytics Link**: Access to shared analytics page

### Persona-Specific Features

- **Student**: Learning progress, mentor connections, course tracking
- **Mentor**: Mentee management, session scheduling, feedback
- **Admin**: User management, system health, support tickets
- **Director**: Program status, strategic initiatives, stakeholder updates
- **Analyst**: Data analysis, report generation, insights

## Development Authentication

Currently, the platform uses **mock authentication**:

- No backend authentication required
- All routes are accessible
- Persona selection is for UI routing only
- No session management

### Testing Different Personas

1. Navigate to `/login`
2. Click persona badges or quick links
3. Or go directly to `/dashboard/{persona}`:
   - `/dashboard/student`
   - `/dashboard/mentor`
   - `/dashboard/admin`
   - `/dashboard/director`
   - `/dashboard/analyst`

### Analytics Page

- Accessible at `/dashboard/analytics`
- Uses ISR (Incremental Static Regeneration) with 60-second revalidation
- Shows success/failure breakdown, heatmap, and system metrics

## Scripts

### Next.js App

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Design System Usage

### Components

All UI components are in `/components/ui/` and follow OCH design system:

```tsx
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'

// Usage examples
<Button variant="defender" glow>Click Me</Button>
<Card gradient="defender">Content</Card>
<Badge variant="mint">New</Badge>
<ProgressBar value={75} variant="defender" />
```

### Colors

Use OCH colors via Tailwind classes:

```tsx
<div className="bg-och-midnight text-och-mint">
  <button className="bg-och-defender hover:bg-och-defender/90">
    Action
  </button>
</div>
```

### Gradients

```tsx
<div className="bg-defender-gradient">
  {/* Defender gradient background */}
</div>
<div className="bg-leadership-gradient">
  {/* Leadership gradient background */}
</div>
```

## Documentation

Comprehensive documentation is available in `/docs`:

- **STYLE_GUIDE.md**: Complete design system reference
- **PERSONA_FLOWS.md**: Authentication and routing flows
- **FRONTEND_ARCHITECTURE.md**: Technical architecture details
- **NAVIGATION_DESIGN.md**: Navigation patterns and implementation

## Production Considerations

### Required Implementations

1. **Authentication Backend**:
   - JWT or session-based authentication
   - User role/persona validation
   - Protected routes middleware

2. **API Integration**:
   - Replace mock data with API calls
   - Error handling and loading states
   - Data fetching patterns

3. **Security**:
   - CSRF protection
   - Rate limiting
   - Input validation
   - XSS prevention

4. **Performance**:
   - Image optimization
   - Code splitting
   - Caching strategies
   - Bundle size optimization

5. **Testing**:
   - Unit tests for components
   - Integration tests for flows
   - E2E tests for critical paths

## Technologies

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Charts**: Recharts (placeholder)
- **Templates**: EJS (landing pages)

## License

Copyright 2024 OCH Platform. All rights reserved.

