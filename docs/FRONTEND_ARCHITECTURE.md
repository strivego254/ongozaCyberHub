# Frontend Architecture Documentation

## Project Structure

```
frontend/
├── landing_pages/
│   ├── views/
│   │   └── index.ejs          # Main landing page (EJS template)
│   └── public/
│       └── css/
│           └── style.css      # Landing page styles
│
└── nextjs_app/
    ├── app/                    # Next.js App Router
    │   ├── layout.tsx          # Root layout
    │   ├── page.tsx            # Home page
    │   ├── globals.css         # Global styles and OCH theme
    │   ├── login/
    │   │   └── page.tsx        # Login page
    │   ├── signup/
    │   │   └── page.tsx        # Signup page
    │   └── dashboard/
    │       ├── page.tsx        # Dashboard redirect
    │       ├── student/
    │       │   ├── page.tsx
    │       │   └── student-client.tsx
    │       ├── mentor/
    │       │   ├── page.tsx
    │       │   └── mentor-client.tsx
    │       ├── admin/
    │       │   ├── page.tsx
    │       │   └── admin-client.tsx
    │       ├── director/
    │       │   ├── page.tsx
    │       │   └── director-client.tsx
    │       ├── analyst/
    │       │   ├── page.tsx
    │       │   └── analyst-client.tsx
    │       └── analytics/
    │           ├── page.tsx    # Server component (ISR)
    │           └── analytics-client.tsx
    │
    ├── components/
    │   └── ui/
    │       ├── Button.tsx      # OCH-styled button component
    │       ├── Card.tsx        # Card component with gradients
    │       ├── Badge.tsx       # Badge component
    │       └── ProgressBar.tsx # Progress bar component
    │
    ├── tailwind.config.ts      # Tailwind config with OCH colors
    ├── next.config.js          # Next.js configuration
    ├── tsconfig.json           # TypeScript configuration
    ├── postcss.config.js       # PostCSS configuration
    └── package.json            # Dependencies
```

## Technology Stack

### Core Framework
- **Next.js 14**: App Router for server components and routing
- **React 18**: UI library
- **TypeScript**: Type safety

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Custom OCH Design System**: Colors, typography, components

### Additional Libraries
- **Recharts**: Chart library (placeholder for analytics)
- **clsx**: Conditional className utility

### Landing Pages
- **EJS**: Template engine for server-rendered landing pages
- **Vanilla CSS**: Custom styles for landing pages

## Architecture Patterns

### Component Architecture

#### Server Components (Default)
- All `page.tsx` files are server components by default
- Used for data fetching and static generation
- Example: `/dashboard/analytics/page.tsx` uses ISR

#### Client Components
- Components with interactivity use `'use client'` directive
- All `*-client.tsx` files are client components
- Handle user interactions, state, and browser APIs

#### UI Components
- Located in `/components/ui/`
- Reusable, styled components following OCH design system
- Support variants, sizes, and OCH color themes

### Routing Strategy

#### App Router (Next.js 14)
- File-based routing in `/app` directory
- Nested routes for dashboards: `/dashboard/{role}`
- Server and client components can coexist

#### Route Structure
```
/                    → Home page
/login               → Login page (client)
/signup              → Signup page (client)
/dashboard           → Redirects to /dashboard/student
/dashboard/{role}    → Role-specific dashboard (client)
/dashboard/analytics → Analytics page (server + client)
```

### Data Flow

#### Mock Data
- Currently using hardcoded mock data in components
- No API integration yet
- Data structure mimics expected backend responses

#### ISR (Incremental Static Regeneration)
- Analytics page uses `revalidate = 60` (60 seconds)
- Server component fetches/generates data
- Client component receives data as props

### Theming System

#### Design Tokens
- Defined in `tailwind.config.ts`
- OCH color palette as Tailwind theme extension
- Custom gradients and animations

#### Global Styles
- `globals.css` contains:
  - Tailwind directives
  - Inter font import
  - CSS custom properties for OCH colors
  - Typography defaults
  - Motion reduction support

#### Component Theming
- Components accept variant props
- Variants map to OCH color system
- Consistent styling across all components

## Dashboard Rendering

### Pattern: Server + Client Split

Each dashboard follows this pattern:

1. **Server Component** (`page.tsx`):
   - Can fetch data (future)
   - Renders client component wrapper
   - Handles metadata and SEO

2. **Client Component** (`{role}-client.tsx`):
   - Handles interactivity
   - Manages local state
   - Renders UI with mock data

### Example Structure

```typescript
// page.tsx (Server)
export default function StudentDashboard() {
  return <StudentClient />
}

// student-client.tsx (Client)
'use client'
export default function StudentClient() {
  // Interactive logic and UI
}
```

## Styling Conventions

### Tailwind Classes
- Use Tailwind utility classes for styling
- OCH colors via `och-{color}` prefix
- Custom gradients via `bg-{gradient-name}-gradient`

### Component Styling
- Components use `clsx` for conditional classes
- Variant-based styling through props
- Consistent spacing using Tailwind scale

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl, 2xl
- Grid layouts adapt to screen size

## State Management

### Current Approach
- Local component state with `useState`
- No global state management yet
- Props drilling for data passing

### Future Considerations
- Context API for theme/user state
- Zustand or Redux for complex state
- React Query for server state

## Performance Optimizations

### Code Splitting
- Next.js automatically code-splits by route
- Client components are lazy-loaded
- Dynamic imports available for heavy components

### Image Optimization
- Use Next.js `Image` component (when needed)
- Automatic optimization and lazy loading

### Caching
- ISR for analytics page (60s revalidation)
- Static generation for landing pages
- Browser caching for static assets

## Build & Deployment

### Development
```bash
cd frontend/nextjs_app
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
- Create `.env.local` for environment-specific config
- API endpoints, auth keys, etc.

## Future Enhancements

### Planned Features
1. API integration layer
2. Authentication middleware
3. Real-time updates (WebSockets)
4. Advanced analytics charts
5. Internationalization (i18n)
6. PWA support

### Technical Debt
1. Replace mock data with API calls
2. Implement proper authentication
3. Add error boundaries
4. Implement loading states
5. Add unit and integration tests
6. Set up CI/CD pipeline

