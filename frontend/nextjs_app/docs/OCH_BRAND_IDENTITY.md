# OCH Brand Identity System

## Overview

Ongóza Cyber Hub (OCH) is a mission-driven, Africa-first, defender-first platform. This document outlines the complete brand identity system as specified in the OCH UI-UX Design System Master Document.

## 1. Brand Philosophy

The design language must feel:
- **Purposeful** - Every element serves a clear mission
- **Structured** - Military ops center organization
- **Military-inspired** - SOC dashboard aesthetics
- **Minimalistic** - Zero clutter, clean interfaces
- **Confident** - Bold, assertive presence
- **High-performance** - Fast, efficient, responsive
- **Guided** - Clear pathways and direction
- **Futuristic** - Modern, forward-looking design

**Core Message:** "We train defenders. We build leaders. We protect nations."

## 2. Brand Attributes

| Attribute | Description |
|-----------|-------------|
| **Mission-driven** | Interface feels structured like a military ops center |
| **African identity** | Warm accents, patterns, tones that subtly reference African design |
| **High-clarity** | Zero clutter, crisp typography, strong hierarchy |
| **Professional** | Suitable for enterprise and national ministries |
| **Transformational** | Encourages learner growth and psychological empowerment |

## 3. Color System

### 3.1 Primary Palette (Cyber + Mission Tone)

| Color | Hex | Purpose |
|-------|-----|---------|
| **OCH Midnight Black** | `#0A0A0C` | Backgrounds, dashboards |
| **Defender Blue** | `#0648A8` | Primary CTA, brand strength |
| **Cyber Mint** | `#33FFC1` | Highlights, success, data pulses |
| **Signal Orange** | `#F55F28` | Alerts, warnings, mission urgency |
| **Steel Grey** | `#A8B0B8` | Secondary text, outlines |

### 3.2 Secondary Palette (Africa-inspired)

| Color | Hex | Use Case |
|-------|-----|----------|
| **Sahara Gold** | `#C89C15` | Leadership elements |
| **Desert Clay** | `#E36F46` | Entrepreneurship accents |
| **Savanna Green** | `#4FAF47` | Growth, progression indicators |
| **Night Sky Blue** | `#213A7F` | Background gradients |

### 3.3 Gradients

- **Defender Gradient:** `linear-gradient(135deg, #0648A8 0%, #0A0A0C 100%)`
- **Leadership Gradient:** `linear-gradient(135deg, #C89C15 0%, #0A0A0C 100%)`

### Usage in Tailwind

```tsx
// Primary colors
<div className="bg-och-midnight text-och-mint">
<div className="bg-och-defender text-white">
<div className="text-och-orange">Warning</div>

// Secondary colors
<div className="bg-och-gold text-och-midnight">
<div className="bg-och-desert-clay">
<div className="text-och-savanna-green">Success</div>
<div className="bg-och-night-sky">

// Gradients
<div className="bg-defender-gradient">
<div className="bg-leadership-gradient">
```

## 4. Typography

### 4.1 Primary Typeface

**Inter** - Chosen for clarity, modernity, and versatility.

### 4.2 Typographic Hierarchy

| Level | Size | Weight | Use Case |
|-------|------|--------|----------|
| **H1 - Mission Title** | 32-36px | Bold (700) | Mission pages, dashboards |
| **H2 - Section Title** | 26-28px | Bold (700) | Modules, track headers |
| **H3 - Subtitle** | 20-22px | Semi-Bold (600) | Forms, panels |
| **Body L** | 18px | Regular (400) | Playbook content |
| **Body M** | 16px | Regular (400) | Most text |
| **Body S** | 14px | Regular (400) | Tooltips, metadata |

### Usage

```tsx
<h1>Mission Title</h1>
<h2>Section Title</h2>
<h3>Subtitle</h3>
<p>Body text</p>
<p className="body-l">Playbook content</p>
<span className="body-s">Tooltip text</span>
```

## 5. Iconography

### 5.1 Icon Style

- **Style:** Duotone (Midnight Black + Defender Blue)
- **Line width:** 1.75px
- **Inspiration:** SOC dashboards + African geometry

### 5.2 Icon Categories

1. **Mission/SOC icons:** Radar, shield, target, logs
2. **Recipe icons:** Flask, wrench, code, flowchart
3. **Leadership icons:** Laurel wreath, torch, upward arrow
4. **Marketplace icons:** Contract, briefcase, handshake
5. **Portfolio icons:** Document, star, folder
6. **Enterprise/National icons:** Map, building, graph, globe

## 6. Component Library

### 6.1 Core Components

#### Buttons

| Type | Style |
|------|-------|
| **Primary CTA** | Defender Blue + white text |
| **Secondary CTA** | Black border + white text |
| **Mission Start** | Gradient + mission icon |
| **Warning/Retry** | Signal Orange |

#### Badges

- **Beginner:** Mint outline
- **Intermediate:** Blue solid
- **Advanced:** Gold outline
- **Mastery:** Gold solid
- **VIP:** Gold embossed
- **Marketplace:** Mint solid

#### Progress Bars

- Rounded 6px
- Color-coded by track
- Animated pulse for mission progress

#### Cards

Card Types:
1. Mission Card
2. Recipe Card
3. Track Module Card
4. Marketplace Task Card
5. Portfolio Artifact Card
6. Analytics Insight Card

All cards use 6px border radius.

### 6.2 Mission Engine Components

- Mission Header Block
- Mission Subtask Panel
- Recipe Suggestions
- Decision Node Component
- Evidence Upload Module
- Rubric Scoring Grid

### 6.3 Recipe Engine Components

- Recipe Pill
- Step-by-Step Accordion
- In-Mission Recipe Sidebar

### 6.4 Track & Program Components

- Track Selector Wheel (radial selector for 5 OCH tracks)
- Module List
- Reflection Box

### 6.5 Portfolio Components

- Portfolio Artifact Card
- Skill Radar Visualization (5-8 skill categories)

### 6.6 Marketplace Components

- Opportunity Card
- Task Submission Area

### 6.7 Enterprise Components

- Team Skill Heatmap
- Mission Performance Graph

## 7. Interaction Patterns

### 7.1 Navigation Patterns

**Global Navigation:**
- Tracks
- Missions
- Recipes
- VIP
- Marketplace
- Portfolio
- Dashboard (Admin/Enterprise)

**Secondary Navigation:**
Tabs inside Missions, Tracks, Marketplace, Portfolio, Analytics

### 7.2 Mission Interaction Patterns

1. **Mission Flow:** Overview → Story → Subtasks → Decision nodes → Evidence submission → Mentor review → Completion & reflection
2. **Mentor Feedback Loop:** Learner submits → Mentor scores → Learner revises → Mentor approves
3. **Adaptive Help:** Recipe auto-suggestions, recommended missions, tool tips

### 7.3 Recipe Interaction Patterns

- Micro-learning: Tiny actionable steps
- Inline Usage: Recipe pops up in mission sidebar
- Learner Logs: Track recipe usage → impact analytics

### 7.4 VIP Leadership Interaction Patterns

- Reflection prompts after missions
- Leadership decision logs
- Purpose alignment prompts
- Leadership growth timeline

### 7.5 Marketplace Interaction Patterns

1. Apply → Complete → Review (consistent across project types)
2. Skill Match Preview (match percentage before applying)
3. Portfolio Auto-Link (completed tasks auto-add to portfolio)

### 7.6 Enterprise Interaction Patterns

- Drill down from team → individual
- Compare skill heatmaps across teams
- Assign missions from dashboard
- Export performance summaries

## 8. Page Templates & Layout System

### 8.1 Grid System

- 12-column grid
- 24px gutters
- Desktop-first, mobile responsive

### 8.2 Page Templates

1. **Mission Page Template:** Left (mission index), Middle (main content), Right (recipe sidebar)
2. **Track Module Page:** Hero header, Module list, Reflection area
3. **VIP Leadership Page:** Two-column layout, Reflection feed, Leadership meter
4. **Portfolio Page:** Grid of artifacts, Radar chart, Role filter
5. **Marketplace Page:** Card layout for tasks, Sidebar filters, Task details modal
6. **Enterprise Dashboard:** Executive summary hero, Cards grid, Heatmaps, Drilldown tree

## 9. Accessibility & Interaction Principles

### 9.1 Color Contrast

- **Minimum contrast ratio:** 4.5:1

### 9.2 Feedback

Always show:
- Success
- Error
- Warning
- Loading

### 9.3 Motion

- Subtle, purposeful animations
- Respect `prefers-reduced-motion`

### 9.4 Readability

- Short paragraphs
- Bullets
- Short sentences

## 10. Design System for Video & Visual Content

### 10.1 Lower Thirds

- Defender blue bar
- White text
- Subtitle in mint

### 10.2 Intro Slide Template

- OCH logo
- Title
- Mission badge

### 10.3 Outro Slide Template

- "Proceed to Mission" CTA
- Track icon

### 10.4 Animation Guidelines

- Clean transitions
- SOC-style data pulses
- Radar sweeps
- Line animations
- No heavy gimmicks

## Implementation Notes

All brand colors, typography, and design tokens are defined in:
- `tailwind.config.ts` - Tailwind configuration
- `app/globals.css` - Global CSS variables and base styles

The design system is consistently applied across all dashboards and components to maintain brand identity and user experience standards.

