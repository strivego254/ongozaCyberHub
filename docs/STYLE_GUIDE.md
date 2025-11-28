# OCH Platform Style Guide

## Color System

### Primary Colors

- **Midnight** (`#0A0A0C`): Primary background color, represents depth and professionalism
- **Defender** (`#0648A8`): Primary action color, trust and reliability
- **Mint** (`#33FFC1`): Accent color, growth and innovation
- **Gold** (`#C89C15`): Leadership and achievement
- **Orange** (`#F55F28`): Energy and urgency
- **Steel** (`#A8B0B8`): Neutral text and borders

### Usage Guidelines

- Use Midnight as the primary background for all pages
- Defender for primary CTAs and important actions
- Mint for highlights, success states, and positive indicators
- Gold for leadership-related content and achievements
- Orange for warnings, urgent actions, and program director themes
- Steel for secondary text, borders, and subtle UI elements

### Gradients

- **Defender Gradient**: `linear-gradient(135deg, #0648A8, #0A0A0C)` - Used for cards and hero sections
- **Leadership Gradient**: `linear-gradient(135deg, #C89C15, #0A0A0C)` - Used for leadership-focused content

## Typography

### Font Family

- **Primary**: Inter (Google Fonts)
- **Fallback**: System font stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', etc.)

### Headings

- **H1**: 2.5rem (40px), weight 800, letter-spacing -0.03em
- **H2**: 2rem (32px), weight 700, letter-spacing -0.02em
- **H3**: 1.5rem (24px), weight 700, letter-spacing -0.02em

### Body Text

- **Default**: 1rem (16px), line-height 1.6
- **Small**: 0.875rem (14px)
- **Large**: 1.125rem (18px)

### Letter Spacing

- Headings: -0.02em to -0.03em (tight)
- Body: Default (0em)

## Component Spacing

### Standard Spacing Scale

- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)
- **3xl**: 4rem (64px)

### Component Padding

- **Cards**: 1.5rem (24px) standard, 2rem (32px) for larger cards
- **Buttons**: 0.75rem vertical, 1.5-2rem horizontal
- **Inputs**: 0.75rem vertical, 1rem horizontal

### Grid Gaps

- **Small grids**: 1rem (16px)
- **Medium grids**: 1.5rem (24px)
- **Large grids**: 2rem (32px)

## Component Rules

### Buttons

- Border radius: 8px (rounded-lg)
- Font weight: 600 (semibold)
- Transition: 200ms for all interactions
- Focus states: Ring with 2px width, offset by 2px

### Cards

- Border radius: 12px (rounded-xl)
- Shadow: Standard shadow-lg
- Border: 1px solid with Steel at 20% opacity
- Background: Midnight with optional gradient overlay

### Badges

- Border radius: 9999px (rounded-full)
- Padding: 0.5rem vertical, 0.625rem horizontal
- Font size: 0.75rem (12px)
- Font weight: 500 (medium)

### Progress Bars

- Height: 0.625rem (10px)
- Border radius: 9999px (rounded-full)
- Background: Steel at 20% opacity
- Transition: 500ms for smooth animations

## Animations

### Glow Effect

- Duration: 2s
- Easing: ease-in-out
- Iteration: infinite alternate
- Used for: Important CTAs and interactive elements

### Pulse Glow

- Duration: 2s
- Easing: cubic-bezier(0.4, 0, 0.6, 1)
- Iteration: infinite
- Used for: Cards and attention-grabbing elements

### Hover Transitions

- Transform: translateY(-2px to -8px)
- Duration: 200-300ms
- Easing: ease-in-out

## Accessibility

### Color Contrast

- All text meets WCAG AA standards (4.5:1 minimum)
- Interactive elements have visible focus states
- Error states use Orange with sufficient contrast

### Motion

- Respects `prefers-reduced-motion` media query
- All animations can be disabled for accessibility

### Focus Management

- All interactive elements have visible focus rings
- Focus rings use Defender color with 2px width
- Focus offset: 2px from element edge

## Responsive Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## Dark Mode

The platform uses a dark-first approach with Midnight as the base. All components are designed for dark backgrounds by default.

