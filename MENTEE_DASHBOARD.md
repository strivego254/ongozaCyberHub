# Mentee Dashboard - UI/UX Implementation

## Overview

Comprehensive mentee dashboard implementing the OCH philosophy: **"Mentees do the work. We guide the transformation."**

The dashboard provides mentees with all tools needed to learn, practice, self-reflect, build habits, submit missions, and grow their portfolio, while OCH provides structure, mentorship, journey architecture, AI coaching, analytics, and career readiness visibility.

## Dashboard Structure

### Main Dashboard (`/dashboard/mentee`)

The mentee dashboard is organized into tabs:

1. **Overview** - Main dashboard with all subsystems
2. **Missions** - Missions Execution Platform (MXP)
3. **Portfolio** - Portfolio Engine
4. **Coaching** - Coaching OS + AI Coach
5. **Community** - Community Engine + Mentorship OS

### Core Components

#### 1. OCH Profiler (`ProfilerCard.tsx`)
**Location**: `components/mentee/ProfilerCard.tsx`

**Features**:
- Current Identity display (learning style, exposure level, career goals)
- Future-You Projection (AI-generated career path)
- Track recommendations
- Readiness timeline

**User Actions**:
- Complete profiler assessment
- View full profile
- See Future-You projection

#### 2. Coaching OS (`CoachingOSCard.tsx`)
**Location**: `components/mentee/CoachingOSCard.tsx`

**Features**:
- **Habits Tab**: Track daily/weekly habits with streaks
- **Goals Tab**: Set and track learning goals with progress
- **Reflections Tab**: Self-reflection journal entries

**User Actions**:
- Mark habits complete
- Update goal progress
- Write reflections
- View habit streaks

**Philosophy**: "Mentees do the work" - mentees build habits, set goals, take actions, and reflect

#### 3. AI Coach (`AICoachCard.tsx`)
**Location**: `components/mentee/AICoachCard.tsx`

**Features**:
- **Nudges Tab**: Reminders, encouragement, tips, challenges
- **Recommendations Tab**: Personalized content recommendations
- **Learning Plans Tab**: AI-generated learning path

**User Actions**:
- View nudges and act on them
- Explore recommendations
- Follow learning plan

**Philosophy**: "We guide the transformation" - AI provides guidance, nudges, and learning plans

#### 4. Missions/MXP (`MissionsCard.tsx`)
**Location**: `components/mentee/MissionsCard.tsx`

**Features**:
- Filter missions (all, active, completed, pending)
- Mission progress tracking
- Submission interface
- Evidence collection

**User Actions**:
- Start missions
- Continue active missions
- Submit completed missions
- View mission details

**Philosophy**: "Mentees do the work" - mentees submit missions and build evidence

#### 5. Portfolio Engine (`PortfolioCard.tsx`)
**Location**: `components/mentee/PortfolioCard.tsx`

**Features**:
- Portfolio items (missions, projects, certifications)
- Publication status (published, draft, private)
- Skills tagging
- Marketplace visibility

**User Actions**:
- View portfolio items
- Edit draft items
- Publish to marketplace
- Manage portfolio

#### 6. TalentScope Analytics (`TalentScopeCard.tsx`)
**Location**: `components/mentee/TalentScopeCard.tsx`

**Features**:
- **Overview Tab**: Overall readiness score, completion metrics
- **Skills Tab**: Skill heatmap with evidence counts
- **Readiness Tab**: Career readiness levels (entry, mid, senior)

**User Actions**:
- View readiness score
- Track skill development
- Monitor career readiness

#### 7. Community Engine (`CommunityCard.tsx`)
**Location**: `components/mentee/CommunityCard.tsx`

**Features**:
- **Groups Tab**: Cohorts, tracks, interest groups
- **Leaderboard Tab**: Rankings and scores
- **Activity Tab**: Recent community activity

**User Actions**:
- Join groups
- View leaderboard
- Engage with community

#### 8. Mentorship OS (`MentorshipCard.tsx`)
**Location**: `components/mentee/MentorshipCard.tsx`

**Features**:
- **Mentors Tab**: Assigned mentors, availability, profiles
- **Cohorts Tab**: Cohort membership and details
- **Sessions Tab**: Upcoming mentor sessions

**User Actions**:
- View mentor profiles
- Book mentor sessions
- Access cohort resources

**Philosophy**: "We guide the transformation" - human mentors provide guidance alongside AI

#### 9. Curriculum Engine (`CurriculumCard.tsx`)
**Location**: `components/mentee/CurriculumCard.tsx`

**Features**:
- **Tracks Tab**: Recommended tracks, progress
- **Modules Tab**: Module progression, status (locked, available, in progress, completed)

**User Actions**:
- View track details
- Start/continue modules
- Track module progress

#### 10. Calendar & Events (`CalendarCard.tsx`)
**Location**: `components/mentee/CalendarCard.tsx`

**Features**:
- Upcoming sessions
- Mission deadlines
- Cohort events
- Calendar integration

**User Actions**:
- View upcoming events
- Access calendar
- Set reminders

## Dashboard Layout

### Overview Tab Layout

```
┌─────────────────────────────────────────────────────────┐
│ Hero Metrics (4 cards: Active, Completed, Progress, Portfolio) │
└─────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────┐
│ Left Column          │ Right Column         │
├──────────────────────┼──────────────────────┤
│ • OCH Profiler       │ • TalentScope        │
│ • AI Coach           │ • Mentorship OS      │
│ • Coaching OS        │ • Calendar           │
└──────────────────────┴──────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Full Width Components                                   │
├─────────────────────────────────────────────────────────┤
│ • Missions/MXP                                         │
│ • Portfolio Engine                                      │
│ • Community Engine                                      │
│ • Curriculum Engine                                     │
└─────────────────────────────────────────────────────────┘
```

## Design Principles

### Color Coding

- **Defender Blue** (`#0648A8`): Missions, curriculum, primary actions
- **Cyber Mint** (`#33FFC1`): AI Coach, portfolio, analytics highlights
- **Sahara Gold** (`#C89C15`): Mentorship, leadership, achievements
- **Signal Orange** (`#F55F28`): Warnings, urgent actions
- **Steel Grey** (`#A8B0B8`): Secondary text, borders

### Typography

- **H1** (32px): Page titles
- **H2** (26px): Section headers
- **H3** (20px): Card titles
- **Body M** (16px): Primary content
- **Body S** (14px): Secondary content, labels

### Component Patterns

1. **Cards**: All major components use the `.card` class with borders
2. **Tabs**: Consistent tab navigation across components
3. **Progress Bars**: Visual progress indicators
4. **Badges**: Status indicators (beginner, intermediate, advanced, mastery)
5. **Buttons**: Primary (blue), Secondary (outline), Mission (gradient)

## User Journey

### New Mentee Flow

1. **Signup** → Default "Mentee" role assigned
2. **Complete Profiler** → Future-You projection generated
3. **View Dashboard** → See all subsystems
4. **Start First Mission** → Begin evidence collection
5. **Build Habits** → Set up Coaching OS
6. **Join Community** → Connect with cohort
7. **Track Progress** → Monitor TalentScope analytics

### Daily Mentee Flow

1. **Check Dashboard** → View nudges, missions, goals
2. **Review AI Coach** → Get recommendations and guidance
3. **Work on Missions** → Practice and submit
4. **Update Habits** → Mark habits complete
5. **Reflect** → Write reflections in Coaching OS
6. **Engage Community** → Participate in groups
7. **Track Analytics** → Monitor progress in TalentScope

## API Integration

### Data Fetching

The dashboard fetches data from:

- **Django API**:
  - User profile (`/api/v1/auth/me`)
  - Progress/missions (`/api/v1/progress`)
  - Organizations (`/api/v1/orgs`)

- **FastAPI**:
  - Recommendations (`/api/v1/recommendations`)
  - Personality analysis (future)
  - Embeddings (future)

### Mock Data

Currently, some components use mock data. These should be replaced with API calls:

- Habits (Coaching OS)
- Goals (Coaching OS)
- Portfolio items
- Skill heatmap (TalentScope)
- Community groups
- Mentor assignments
- Calendar events

## Component Props

### Common Props Pattern

```typescript
interface ComponentProps {
  user: User;                    // Current user
  expanded?: boolean;            // Full view vs. card view
  showAll?: boolean;            // Show all items vs. limited
  // Component-specific props
}
```

## Navigation

### Internal Links

All components link to dedicated pages:

- `/dashboard/mentee/profiler` - Full profiler
- `/dashboard/mentee/coaching` - Coaching OS
- `/dashboard/mentee/ai-coach` - AI Coach
- `/dashboard/mentee/missions` - Missions
- `/dashboard/mentee/portfolio` - Portfolio
- `/dashboard/mentee/talentscope` - Analytics
- `/dashboard/mentee/community` - Community
- `/dashboard/mentee/mentorship` - Mentorship
- `/dashboard/mentee/curriculum` - Curriculum
- `/dashboard/mentee/calendar` - Calendar

## Responsive Design

- **Mobile**: Single column, stacked cards
- **Tablet**: 2-column layout for overview
- **Desktop**: Full layout with sidebars

## Accessibility

- Keyboard navigation support
- Screen reader labels
- Focus states (cyber-mint outline)
- Color contrast compliance (WCAG 2.1 AA)

## Next Steps

1. **Implement API Endpoints**:
   - Habits API
   - Goals API
   - Reflections API
   - Portfolio API
   - Skill heatmap API
   - Calendar events API

2. **Create Detail Pages**:
   - Mission detail page
   - Portfolio item page
   - Profiler completion page
   - Learning plan page

3. **Add Interactions**:
   - Real-time updates
   - Notifications
   - Drag-and-drop for portfolio
   - Calendar integration

4. **Enhance Analytics**:
   - Charts and graphs
   - Skill progression timeline
   - Career readiness roadmap

## File Structure

```
frontend/nextjs_app/
├── app/
│   └── dashboard/
│       └── mentee/
│           ├── page.tsx              # Server component
│           └── mentee-client.tsx     # Client component
├── components/
│   └── mentee/
│       ├── ProfilerCard.tsx
│       ├── CoachingOSCard.tsx
│       ├── AICoachCard.tsx
│       ├── MissionsCard.tsx
│       ├── PortfolioCard.tsx
│       ├── TalentScopeCard.tsx
│       ├── CommunityCard.tsx
│       ├── MentorshipCard.tsx
│       ├── CurriculumCard.tsx
│       └── CalendarCard.tsx
```

## Philosophy Implementation

### "Mentees do the work"

Implemented through:
- ✅ Habits tracking (mentees mark habits complete)
- ✅ Goals setting (mentees set and update goals)
- ✅ Mission submissions (mentees submit work)
- ✅ Portfolio building (mentees create evidence)
- ✅ Self-reflection (mentees write reflections)

### "We guide the transformation"

Implemented through:
- ✅ AI Coach (guidance, nudges, learning plans)
- ✅ Mentorship OS (human mentors)
- ✅ Curriculum Engine (structured learning)
- ✅ TalentScope Analytics (progress visibility)
- ✅ Community Engine (peer support)

## Status

✅ **Completed**:
- Dashboard structure
- All 10 component cards
- Tab navigation
- Overview layout
- Component styling

🔄 **In Progress**:
- API integration (some components use mock data)
- Detail pages for each subsystem

📋 **Planned**:
- Real-time updates
- Notifications
- Advanced analytics
- Mobile optimization

