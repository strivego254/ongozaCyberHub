# Director Dashboard Backend - Implementation Guide

## Overview

The Director Dashboard backend provides a high-performance, cached aggregation system for Program Directors to monitor and manage programs, cohorts, mentors, and outcomes at scale. It aggregates data from multiple services and caches results for fast access.

## Architecture

### Components

1. **Cache Models** (`director_dashboard_models.py`)
   - `DirectorDashboardCache`: Per-director summary cache
   - `DirectorCohortDashboard`: Per-cohort detailed cache

2. **Aggregation Service** (`director_dashboard_services.py`)
   - `DirectorDashboardAggregationService`: Aggregates data from:
     - Program Cohort Management
     - Mentorship OS
     - TalentScope Analytics
     - Missions MXP
     - Portfolio Engine
     - Subscription & Billing

3. **Background Workers** (`director_dashboard_tasks.py`)
   - Celery tasks for cache refresh
   - Runs every 5 minutes per director

4. **API Endpoints** (`director_dashboard_views.py`)
   - `/api/v1/director/dashboard/summary/` - Summary metrics
   - `/api/v1/director/dashboard/cohorts/` - Cohort list
   - `/api/v1/director/dashboard/cohorts/{cohort_id}/` - Cohort detail

## Database Schema

### `director_dashboard_cache`
- One row per director
- Cached summary metrics
- Refreshed every 5 minutes

### `director_cohort_dashboard`
- One row per director-cohort pair
- Detailed cohort metrics
- Refreshed on-demand or every 5 minutes

## API Endpoints

### GET /api/v1/director/dashboard/summary/

Returns cached overview:

```json
{
  "active_programs_count": 5,
  "active_cohorts_count": 18,
  "seats_total": 900,
  "seats_used": 850,
  "avg_readiness_score": 72.4,
  "avg_completion_rate": 64.7,
  "mentor_coverage_pct": 90.1,
  "mentors_over_capacity_count": 3,
  "at_risk_mentees_count": 7,
  "alerts": [
    "3 cohorts flagged for low readiness",
    "5 mentors over capacity"
  ],
  "cache_updated_at": "2025-12-04T16:00:00Z"
}
```

### GET /api/v1/director/dashboard/cohorts/

Returns paginated cohort list:

```json
{
  "count": 18,
  "next": "/api/v1/director/dashboard/cohorts?page=2",
  "previous": null,
  "results": [
    {
      "cohort_id": "uuid",
      "cohort_name": "Cyber Builders Jan 2026",
      "track_name": "Cyber Defense",
      "seats_total": 50,
      "seats_used": 49,
      "readiness_avg": 68.1,
      "completion_pct": 54.3,
      "mentor_coverage_pct": 100,
      "flags_active": ["Mentor overload"],
      "milestones_upcoming": [...]
    }
  ]
}
```

### GET /api/v1/director/dashboard/cohorts/{cohort_id}/

Returns detailed cohort analytics:

```json
{
  "cohort_id": "uuid",
  "name": "Cyber Builders Jan 2026",
  "enrollment": {
    "active": 45,
    "paid": 40,
    "scholarship": 3
  },
  "mentors": [...],
  "readiness_distribution": {...},
  "mission_funnel": {...},
  "payments": {...}
}
```

## Background Workers

### Celery Tasks

1. **`director_dashboard.refresh_cache`**
   - Refreshes single director cache
   - Called every 5 minutes per director

2. **`director_dashboard.refresh_all_directors`**
   - Queues refresh for all directors
   - Called by periodic task every 5 minutes

3. **`director_dashboard.refresh_cohort`**
   - Refreshes specific cohort dashboard
   - Called on-demand when cohort data changes

### Management Command

```bash
# Refresh all directors
python manage.py refresh_director_dashboards --all

# Refresh specific director
python manage.py refresh_director_dashboards --director-id 123

# Sync mode (no Celery)
python manage.py refresh_director_dashboards --all --sync
```

### Cron Setup

Add to crontab for periodic refresh:

```bash
*/5 * * * * cd /path/to/django_app && python manage.py refresh_director_dashboards --all --sync
```

## Row Level Security (RLS)

Django doesn't have native PostgreSQL RLS, but we implement equivalent security:

1. **Queryset Filtering**: Directors only see their own data
2. **Permission Checks**: Verify director has access before returning data
3. **View-Level Security**: Check `directed_tracks` relationship

## Performance

- **Cache Hit Rate**: >95% target
- **P95 Latency**: <100ms (cached responses)
- **Cache Refresh**: Every 5 minutes
- **Scale**: Supports 500+ concurrent directors, 100+ programs/cohorts

## Integration Points

### Services to Integrate

1. **TalentScope Analytics**
   - Replace mock `avg_readiness_score` with actual aggregation
   - Add `readiness_distribution` calculation
   - Add `competency_heatmap` generation

2. **Mentorship OS**
   - Replace mock `mentor_session_completion_pct`
   - Calculate `mentors_over_capacity_count`
   - Calculate `mentee_at_risk_count`

3. **Missions MXP**
   - Replace mock `mission_approval_time_avg`
   - Add `mission_funnel` calculation
   - Add `missions_bottlenecked_count`

4. **Portfolio Engine**
   - Replace mock `avg_portfolio_health`
   - Add portfolio health distribution

5. **Subscription & Billing**
   - Replace mock payment data
   - Calculate `payments_overdue_count`
   - Add payment breakdowns

## Testing

Run integration tests:

```bash
python -m pytest tests/test_programs_endpoints.py::TestDirectorDashboard -v
```

## Monitoring

Key metrics to track:
- `director_cache_hit_rate`
- `director_dashboard_p95_latency`
- `cache_refresh_lag`
- `director_cohort_dashboard_staleness`

