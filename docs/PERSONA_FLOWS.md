# Persona Flows Documentation

## Overview

The OCH Platform supports five distinct personas, each with their own authentication flow and dashboard experience.

## Personas

1. **Student** - Learning and mentorship recipient
2. **Mentor** - Guide and supporter
3. **Admin** - Platform administrator
4. **Program Director** - Strategic oversight
5. **Analyst** - Data and insights specialist

## Authentication Flows

### Login Flow

1. User navigates to `/login`
2. User enters email and password
3. (Optional) User selects persona from quick-select badges
4. On submit, user is redirected to:
   - Selected persona dashboard: `/dashboard/{persona}`
   - Default (Student): `/dashboard/student`

### Signup Flow

1. User navigates to `/signup`
2. User enters email, password, and confirms password
3. User **must** select a persona (required field)
4. Persona cards show descriptions and highlight on selection
5. On submit, user is redirected to: `/dashboard/{selected-persona}`

### Quick Access Links

From login page, users can click persona links to directly access dashboards:
- `/dashboard/student`
- `/dashboard/mentor`
- `/dashboard/admin`
- `/dashboard/director`
- `/dashboard/analyst`

## Dashboard Routing

### Route Structure

```
/dashboard
  ├── / (redirects to /dashboard/student)
  ├── /student
  │   └── page.tsx (renders StudentClient)
  ├── /mentor
  │   └── page.tsx (renders MentorClient)
  ├── /admin
  │   └── page.tsx (renders AdminClient)
  ├── /director
  │   └── page.tsx (renders DirectorClient)
  ├── /analyst
  │   └── page.tsx (renders AnalystClient)
  └── /analytics
      └── page.tsx (ISR cached, renders AnalyticsClient)
```

### Dashboard Access

All dashboards are currently accessible without authentication (mock mode). In production:

1. Authentication middleware should verify user session
2. Role-based access control (RBAC) should validate persona
3. Unauthorized access should redirect to `/login`

## Persona-Specific Features

### Student Dashboard

- **KPIs**: Active mentorships, completed courses, learning hours, achievements
- **Actions**: Find mentor, view courses, track progress, join community
- **Features**: Learning progress bars, recent activity, upcoming events
- **Color Theme**: Defender (blue) primary

### Mentor Dashboard

- **KPIs**: Active mentees, sessions this month, average rating, impact score
- **Actions**: Schedule session, view mentees, resources, community
- **Features**: Mentee progress tracking, upcoming sessions, recent feedback
- **Color Theme**: Mint (green) primary, Leadership gradient

### Admin Dashboard

- **KPIs**: Total users, active sessions, system health, support tickets
- **Actions**: User management, system settings, reports, support center
- **Features**: System alerts, recent activity, platform metrics
- **Color Theme**: Gold primary, Leadership gradient

### Program Director Dashboard

- **KPIs**: Program participants, completion rate, satisfaction, budget utilization
- **Actions**: Program overview, strategic planning, stakeholder reports, resource allocation
- **Features**: Program status tracking, key initiatives, stakeholder updates
- **Color Theme**: Orange primary, Leadership gradient

### Analyst Dashboard

- **KPIs**: Data points analyzed, reports generated, insights discovered, accuracy rate
- **Actions**: Run analysis, generate report, export data, create dashboard
- **Features**: Key insights, recent analyses, data sources
- **Color Theme**: Steel (gray) primary, Defender gradient

## Shared Features

### Analytics Page

All personas can access `/dashboard/analytics` which provides:
- Success/failure breakdown
- Action heatmap
- System metrics
- Chart placeholders (Recharts integration ready)

The analytics page uses ISR (Incremental Static Regeneration) with 60-second revalidation.

## Navigation Patterns

### Within Dashboard

- Top-level navigation: Role-specific actions
- Quick links: Common tasks and shortcuts
- Analytics link: Present in all dashboards (bottom right)

### Cross-Persona Navigation

- Users can switch personas via login page quick links
- In production, this should require re-authentication or role switching permissions

## Mock Authentication

Currently, the platform uses mock authentication:
- No actual authentication backend
- No session management
- All routes are accessible
- Persona selection is for UI routing only

## Production Considerations

### Authentication Implementation

1. Implement JWT or session-based authentication
2. Store user persona/role in token or session
3. Validate persona on dashboard access
4. Implement logout functionality

### Role-Based Access Control

1. Verify user has permission for selected persona
2. Some users may have multiple roles
3. Implement role switching mechanism
4. Audit role access logs

### Security

1. Protect all dashboard routes with authentication middleware
2. Validate persona selection on backend
3. Implement CSRF protection
4. Rate limit authentication endpoints

