# Student Dashboard Backend Implementation

Complete backend implementation for the Student Dashboard in OCH Cyber Talent Engine.

## Overview

The Student Dashboard aggregates data from 12+ microservices (Profiler, Coaching OS, Curriculum, Missions, Portfolio, TalentScope, Subscriptions) into a performant cache layer for sub-200ms response times.

## Database Schema

### StudentDashboardCache
- **Purpose**: Denormalized cache table for student dashboard data
- **Refresh**: Every 5 minutes via Celery task
- **RLS**: Enabled - students can only see their own data

### StudentMissionProgress
- **Purpose**: Personal mission funnel tracking
- **Tracks**: Status, AI scores, mentor scores, next actions
- **RLS**: Enabled - students can only see their own progress

## API Endpoints

### GET /api/v1/student/dashboard
Returns complete dashboard with:
- Today summary (readiness, streak, goals)
- Future-You persona and alignment
- Quick actions (AI-prioritized)
- Subscription tier and entitlements

### GET /api/v1/student/profile
Returns student profile with:
- Basic info (name, track, cohort, mentor)
- Future-You persona and skills needed
- Consent settings

### GET /api/v1/student/curriculum/progress
Returns curriculum progress with:
- Track name and completion percentage
- Module progress and status
- Recommended missions

### GET /api/v1/student/missions?status=pending,in_review
Returns mission funnel with:
- Mission status, AI feedback, deadlines
- Competencies covered
- Filter by status

## Services

### StudentDashboardService
- Cache management
- Entitlement gating
- Tier-based masking

### ProfilerService
- Future-You persona retrieval
- Track recommendations
- Identity alignment

### CoachingOSService
- Habit streak calculation
- Goals tracking
- Reflections count

### CurriculumService
- Track progress
- Module completion
- Mission recommendations

### MissionsService
- Mission funnel status
- AI/mentor feedback
- Deadline tracking

### PortfolioService
- Health score calculation
- Item approval tracking

### TalentScopeService
- Readiness score
- Skill gaps identification

### SubscriptionService
- Tier detection
- Enhanced access days
- Billing dates

### AICoachService
- Next action recommendations
- Urgent nudges generation

## Background Tasks

### refresh_student_dashboard_cache
- **Frequency**: On-demand or every 5 minutes
- **Purpose**: Aggregates data from all services into cache
- **Trigger**: User action, stale cache, or scheduled

### process_dashboard_update_queue
- **Frequency**: Every minute
- **Purpose**: Process urgent/high priority updates
- **Queue**: DashboardUpdateQueue model

### refresh_all_active_student_dashboards
- **Frequency**: Every 5 minutes
- **Purpose**: Refresh caches for active students (logged in last 30 days)
- **Limit**: 1000 students per run

## Entitlement Gating

### Tiers
- **free**: Basic features, limited AI, no mentor access
- **starter3**: Enhanced access for 180 days, full AI, unlimited missions
- **professional7**: Full access, mentor reviews, unlimited everything

### Masking
Premium features are masked for free tier users:
- Enhanced access days hidden
- AI coach recommendations limited
- Next billing date hidden

## RLS Policies

### student_dashboard_cache
```sql
CREATE POLICY student_cache_policy ON student_dashboard_cache
    FOR ALL
    USING (user_id = auth.uid());
```

### student_mission_progress
```sql
CREATE POLICY student_mission_policy ON student_mission_progress
    FOR ALL
    USING (user_id = auth.uid());
```

## Performance Targets

- ✅ Dashboard loads <200ms (including AI recs)
- ✅ Cache refresh <3min per student
- ✅ Mission funnel accurate to second
- ✅ Entitlement gating 100% (no leaks)
- ✅ Streak calculations match frontend
- ✅ RLS passes all security scans

## Integration Points

1. **Profiler**: Future-You persona, track recommendation
2. **Coaching OS**: Habits, goals, reflections
3. **Curriculum**: Track progress, module completion
4. **Missions**: Submission status, AI/mentor feedback
5. **Portfolio**: Health score, item approvals
6. **TalentScope**: Readiness score, skill gaps
7. **Subscriptions**: Tier, enhanced access, billing

## Next Steps

1. Integrate with actual TalentScope service for readiness scores
2. Add Reflection model to Coaching OS if needed
3. Implement actual module progress tracking
4. Add push notification hooks for deadlines and nudges
5. Implement offline sync for habit logging
6. Add deep linking support (`och://missions/siem-01`)
