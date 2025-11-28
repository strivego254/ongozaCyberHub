# Navigation Design Documentation

## Overview

Ongoza CyberHub uses a persona-aware navigation system with dropdown menus for platform access, getting started, and sign-in options.

## Landing Page Navigation

### Structure

```
[Logo] [Platform ▼] [Get Started ▼] [Sign In ▼]
```

### Platform Dropdown

**Trigger**: "Platform" link

**Items**:
- Features → `/features`
- Pricing → `/pricing`
- Security → `/security`

**Behavior**:
- Click to open dropdown
- Click outside to close
- Hover to highlight
- Active state on current page

### Get Started Dropdown

**Trigger**: "Get Started" link

**Items**:
- As Student → `/signup?persona=student`
- As Mentor → `/signup?persona=mentor`
- As Director → `/signup?persona=director`

**Behavior**:
- Direct signup with persona pre-selected
- Persona badge shown on signup page
- Default role assignment (Mentee)

### Sign In Dropdown

**Trigger**: "Sign In" link

**Items**:
- Student Portal → `/login?persona=student`
- Mentor Portal → `/login?persona=mentor`
- Admin Portal → `/login?persona=admin`

**Behavior**:
- Direct login with persona context
- Persona-aware login page
- Quick access to role-specific portals

## Dashboard Navigation

### Role-Based Navigation

**Structure**:
```
[Logo] [Dashboard] [Role Switcher ▼] [Profile ▼] [Logout]
```

### Role Switcher

**Display**: Current role badge

**Dropdown**:
- List all user roles
- Switch between roles
- Update dashboard view
- Preserve session

**Implementation**:
```tsx
const { user } = useAuth();
const currentRole = user?.roles?.[0]?.role;
const availableRoles = user?.roles || [];

<RoleSwitcher 
  currentRole={currentRole}
  roles={availableRoles}
  onSwitch={(role) => router.push(`/dashboard/${role}`)}
/>
```

### Profile Dropdown

**Items**:
- Profile Settings → `/settings/profile`
- Account Settings → `/settings/account`
- Preferences → `/settings/preferences`
- Analytics → `/dashboard/analytics` (if permitted)

## Routing Rules

### Persona Parameter

**Format**: `?persona={role}`

**Supported Roles**:
- `student`
- `mentor`
- `admin`
- `director`
- `sponsor`
- `analyst`

**Usage**:
- Landing page links include persona
- Signup/login pages read persona
- Dashboard routing based on roles

### Redirect Flow

**After Login**:
1. Check `redirect` query param
2. If present, redirect to that URL
3. Otherwise, redirect to `/dashboard`
4. Dashboard router redirects to role-specific dashboard

**After Signup**:
1. Redirect to `/login?persona={persona}&registered=true`
2. Show success message
3. User logs in
4. Redirect to dashboard

### Protected Routes

**Middleware Protection**:
- `/dashboard/*` - Requires authentication
- `/settings/*` - Requires authentication
- `/api/*` - API routes (handled by Next.js)

**Role-Based Protection**:
- Dashboard components check roles
- Access denied if role missing
- Redirect to appropriate dashboard

## Dropdown Behavior

### Interaction

**Open**:
- Click trigger button
- Show dropdown menu
- Add `show` class

**Close**:
- Click outside dropdown
- Click another dropdown
- Select menu item
- Press Escape key

### Styling

**Dropdown Menu**:
- Position: Absolute, below trigger
- Background: OCH Midnight
- Border: 2px Steel Grey
- Border radius: 6px
- Shadow: Subtle glow effect

**Menu Items**:
- Padding: 12px 16px
- Hover: Mint background, left border
- Active: Mint text color
- Transition: 200ms

### Accessibility

**Keyboard Navigation**:
- Tab to focus trigger
- Enter/Space to open
- Arrow keys to navigate
- Enter to select
- Escape to close

**Screen Readers**:
- ARIA labels on triggers
- ARIA expanded state
- ARIA controls relationship
- Menu role on dropdown

## Persona Cards Navigation

### Landing Page Personas

**Layout**: 6-column grid (responsive)

**Cards**:
- Student
- Mentor
- Admin
- Program Director
- Sponsor Admin
- Analyst

**Interaction**:
- Hover: Lift effect, glow border
- Click: Navigate to signup with persona
- Visual feedback: Mint border, shadow

### Quick Access Links

**Location**: Login/Signup pages

**Display**: Horizontal button group

**Behavior**:
- Click to switch persona
- Update URL query param
- Reload page with new persona
- Show active state

## Mobile Navigation

### Hamburger Menu

**Trigger**: Menu icon (mobile only)

**Items**:
- All navigation links
- Persona quick links
- Sign in/Sign up

**Behavior**:
- Slide-in menu
- Overlay background
- Close on selection
- Smooth animation

### Responsive Breakpoints

**Desktop** (> 1024px):
- Full navigation bar
- Dropdown menus
- Horizontal layout

**Tablet** (768px - 1024px):
- Condensed navigation
- Stacked dropdowns
- Touch-friendly targets

**Mobile** (< 768px):
- Hamburger menu
- Full-screen overlay
- Vertical navigation

## Implementation

### Dropdown Component

```tsx
function Dropdown({ trigger, items }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="nav-dropdown">
      <button onClick={() => setOpen(!open)}>
        {trigger}
      </button>
      {open && (
        <div className="dropdown-menu">
          {items.map(item => (
            <a href={item.href}>{item.label}</a>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Navigation State

**Current Page**: Track active route
**Persona**: Read from query params
**User Roles**: From auth context
**Dropdown State**: Local component state

## Best Practices

1. **Consistent Navigation**: Same structure across pages
2. **Clear Labels**: Descriptive link text
3. **Visual Feedback**: Hover/active states
4. **Keyboard Access**: Full keyboard support
5. **Mobile First**: Responsive design
6. **Performance**: Lazy load dropdowns
7. **Accessibility**: ARIA labels, roles



