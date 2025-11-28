# Navigation Design Documentation

## Overview

The OCH Platform uses a multi-level navigation system with dropdown menus, persona-based routing, and contextual navigation within dashboards.

## Navigation Components

### Landing Page Navigation

Located in `/frontend/landing_pages/views/index.ejs`

#### Structure
```
Navbar
├── Logo (OCH Platform)
└── Menu
    ├── Platform Dropdown
    ├── Get Started Dropdown
    └── Sign In Dropdown
```

#### Dropdown Behavior

**Platform Dropdown**
- **Trigger**: "Platform" button with ▼ indicator
- **Items**:
  - Features (anchor link)
  - Personas (anchor link)
  - Analytics (anchor link)
- **Behavior**: Click to toggle, click outside to close

**Get Started Dropdown**
- **Trigger**: "Get Started" button
- **Items**:
  - Sign Up (link to `/signup`)
  - Choose Your Role (anchor link)
  - Learn More (anchor link)
- **Behavior**: Same toggle behavior

**Sign In Dropdown**
- **Trigger**: "Sign In" button
- **Items**:
  - Login (link to `/login`)
  - Create Account (link to `/signup`)
- **Behavior**: Same toggle behavior

#### Implementation Details

- Uses vanilla JavaScript for dropdown toggling
- Event listeners on dropdown buttons
- Click outside detection to close dropdowns
- Active state management via CSS classes

### Dashboard Navigation

#### Current State
- No global navigation bar in dashboards
- Each dashboard is self-contained
- Links to analytics page at bottom of each dashboard

#### Navigation Elements

**Quick Actions**
- Grid of action buttons
- Role-specific actions
- Direct links to features

**Analytics Link**
- Present in all dashboards
- Bottom-right placement
- Links to `/dashboard/analytics`

**Persona Switching**
- Available from login page
- Quick links to each persona dashboard
- No in-dashboard persona switching (future feature)

## Routing Rules

### Public Routes

- `/` - Home page
- `/login` - Login page
- `/signup` - Signup page
- Landing pages (EJS)

### Protected Routes (Mock)

- `/dashboard` - Redirects to `/dashboard/student`
- `/dashboard/{role}` - Role-specific dashboards
- `/dashboard/analytics` - Analytics dashboard

### Route Guards (Future)

In production, implement:
1. Authentication check
2. Role-based access control
3. Redirect to login if unauthorized
4. Session validation

## Navigation Patterns

### Anchor Links

Used for same-page navigation:
- `#features` - Scrolls to features section
- `#personas` - Scrolls to personas section
- `#analytics` - Scrolls to analytics section

### External Links

- Links to Next.js app routes use relative paths
- No external URLs currently

### Programmatic Navigation

In Next.js app:
- `useRouter()` hook for client-side navigation
- `redirect()` for server-side redirects
- `Link` component for optimized navigation

## Dropdown Implementation

### HTML Structure

```html
<div class="nav-dropdown">
  <button class="nav-link">Label <span>▼</span></button>
  <div class="dropdown-content">
    <a href="#">Item 1</a>
    <a href="#">Item 2</a>
  </div>
</div>
```

### CSS Styling

- Dropdown content hidden by default (`display: none`)
- Positioned absolutely below trigger
- Styled with OCH colors and borders
- Smooth transitions on hover

### JavaScript Behavior

```javascript
// Toggle on button click
button.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdown.classList.toggle('active');
});

// Close on outside click
document.addEventListener('click', () => {
  dropdowns.forEach(d => d.classList.remove('active'));
});
```

## Persona Navigation

### Persona Selection

**Login Page**
- Optional persona selection via badges
- Quick links to each persona dashboard
- Defaults to student if none selected

**Signup Page**
- Required persona selection
- Visual cards with descriptions
- Highlight on selection

### Persona Cards (Landing Page)

- 6 persona cards in grid layout
- Hover effects with glow
- Direct links to dashboards
- Color-coded by persona

## Mobile Navigation

### Responsive Behavior

- Navigation menu adapts to mobile
- Dropdowns stack vertically on small screens
- Touch-friendly tap targets (min 44px)
- Hamburger menu (future enhancement)

### Breakpoints

- Desktop: Full navigation with dropdowns
- Tablet: Condensed navigation
- Mobile: Stacked menu items

## Accessibility

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows visual flow
- Enter/Space activate buttons
- Escape closes dropdowns (future)

### Screen Readers

- Semantic HTML elements
- ARIA labels for dropdowns (future)
- Descriptive link text
- Focus indicators visible

### Focus Management

- Visible focus states on all interactive elements
- Focus trapped in modals (future)
- Focus restored after navigation

## Future Enhancements

### Planned Features

1. **Breadcrumbs**: Show navigation path in dashboards
2. **Sidebar Navigation**: Persistent navigation in dashboards
3. **Search**: Global search functionality
4. **Notifications**: Notification dropdown in navbar
5. **User Menu**: Profile and settings dropdown
6. **Hamburger Menu**: Mobile-friendly navigation
7. **Keyboard Shortcuts**: Power user navigation

### Technical Improvements

1. **React Navigation Component**: Convert EJS navigation to React
2. **Navigation Context**: Shared navigation state
3. **Active Route Highlighting**: Show current page
4. **Breadcrumb Component**: Reusable breadcrumb navigation
5. **Mobile Menu Component**: Dedicated mobile navigation

## Best Practices

### Navigation Design

- Keep navigation consistent across pages
- Use clear, descriptive labels
- Group related items together
- Limit dropdown depth (max 2 levels)

### User Experience

- Provide multiple ways to access content
- Show current location
- Make navigation predictable
- Minimize clicks to reach content

### Performance

- Lazy load navigation components
- Optimize dropdown animations
- Minimize JavaScript for navigation
- Use CSS transitions over JavaScript

