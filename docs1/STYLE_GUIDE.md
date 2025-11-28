# OCH Design System Style Guide

## Color System

### Primary Colors

- **OCH Midnight** (`#0A0A0C`): Primary background color
- **Defender Blue** (`#0648A8`): Primary action color, trust and security
- **Cyber Mint** (`#33FFC1`): Accent color, success states, highlights
- **Sahara Gold** (`#C89C15`): Leadership, premium features
- **Signal Orange** (`#F55F28`): Warnings, alerts, critical actions
- **Steel Grey** (`#A8B0B8`): Text secondary, borders, disabled states

### Usage Guidelines

- **Midnight**: Always use as page background
- **Defender Blue**: Primary buttons, links, important UI elements
- **Cyber Mint**: Success states, hover effects, progress indicators
- **Sahara Gold**: Leadership roles, premium badges, special highlights
- **Signal Orange**: Error states, warnings, destructive actions
- **Steel Grey**: Secondary text, borders, placeholders

## Typography

### Font Family

- **Primary**: Inter (Google Fonts)
- **Fallback**: system-ui, sans-serif

### Type Scale

#### Headings

- **H1**: 4xl/5xl (36px/48px), bold, -0.03em letter-spacing
- **H2**: 3xl/4xl (30px/36px), bold, -0.02em letter-spacing
- **H3**: 2xl/3xl (24px/30px), semibold, -0.02em letter-spacing

#### Body Text

- **Body L**: 18px, normal weight
- **Body M**: 16px, normal weight (default)
- **Body S**: 14px, normal weight
- **Body XS**: 12px, normal weight

### Typography Rules

1. Headings always use tight letter spacing (-0.02em to -0.03em)
2. Body text uses default letter spacing
3. All text uses Inter font family
4. Maintain sufficient contrast (WCAG AA minimum)

## Component Spacing

### Padding

- **Card**: 24px (p-6)
- **Button**: 12px vertical, 24px horizontal (py-3 px-6)
- **Input**: 12px vertical, 16px horizontal (py-3 px-4)

### Margins

- **Section spacing**: 48px (mb-12)
- **Card spacing**: 24px (gap-6)
- **Element spacing**: 16px (gap-4)

### Border Radius

- **Cards/Buttons**: 6px (rounded-card)
- **Badges**: Full (rounded-full)
- **Inputs**: 6px (rounded-card)

## Component Guidelines

### Buttons

- Primary: Defender Blue background, white text
- Secondary: Transparent, bordered, steel grey
- Mint: Cyber Mint background, midnight text
- Warning: Signal Orange background, white text
- Ghost: Transparent, text only

### Cards

- Background: OCH Midnight
- Border: 2px solid (variant color)
- Padding: 24px
- Border radius: 6px
- Hover: Border color change, glow effect

### Badges

- Beginner: Mint variant
- Intermediate: Blue variant
- Advanced: Gold variant
- Mastery: Gold with opacity
- VIP: Gold to Orange gradient

### Progress Bars

- Height: 8px (h-2)
- Background: Steel grey with opacity
- Fill: Variant color (blue, mint, gold)
- Smooth transitions (500ms)

## Animations

### Glow Effects

- **Mint Glow**: `0 0 20px rgba(51, 255, 193, 0.3)`
- **Blue Glow**: `0 0 20px rgba(6, 72, 168, 0.3)`
- **Gold Glow**: `0 0 20px rgba(200, 156, 21, 0.3)`

### Pulse Animation

- **Pulse Mint**: 2s infinite, cubic-bezier easing
- Use for attention-grabbing elements

### Transitions

- **Default**: 200ms (duration-200)
- **Smooth**: 500ms (duration-500)
- **Easing**: Default (ease-in-out)

## Gradients

### Defender Gradient

- `linear-gradient(135deg, #0648A8, #0A0A0C)`
- Use for hero sections, primary backgrounds

### Leadership Gradient

- `linear-gradient(135deg, #C89C15, #0A0A0C)`
- Use for leadership/executive sections

## Accessibility

### Contrast Ratios

- Text on Midnight: Minimum 4.5:1
- Text on Blue: White text (21:1)
- Text on Mint: Midnight text (4.5:1)
- Text on Gold: White text (4.5:1)

### Focus States

- All interactive elements must have visible focus states
- Use Cyber Mint for focus indicators
- Minimum 2px outline

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order should be logical
- Skip links for main content

## Responsive Design

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Guidelines

- Stack grid layouts vertically
- Reduce padding/margins by 25%
- Larger touch targets (minimum 44px)
- Simplified navigation

## Implementation

### Tailwind Classes

Use Tailwind utility classes with OCH color tokens:

```tsx
className="bg-och-midnight text-white border-2 border-defender-blue"
```

### CSS Variables

For custom styles, use CSS variables:

```css
background-color: var(--och-midnight);
color: var(--cyber-mint);
```

### Component Props

Use variant props for consistent styling:

```tsx
<Button variant="primary" size="md" glow />
<Card variant="blue" hover />
<Badge variant="advanced" />
```



