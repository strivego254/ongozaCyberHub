# Student Dashboard Backend

Complete backend implementation for the OCH Cyber Talent Engine Student Dashboard.

## Overview

Aggregates data from 12+ microservices into a performant cache layer for sub-100ms dashboard responses. Handles 10K+ concurrent students across Africa.

## Architecture

- **Cache Layer**: Denormalized `student_dashboard_cache` table for fast reads
- **Update Queue**: Prioritized queue for background refresh jobs
- **Service Aggregation**: Pulls data from TalentScope, Coaching OS, Missions, Portfolio, Cohort, AI Coach, Notifications, Leaderboard
- **Real-time Updates**: SSE streaming endpoint for live dashboard updates
- **Background Workers**: Periodic refresh of stale caches and queued updates

## API Endpoints

### GET `/api/v1/student/dashboard`

Returns aggregated student dashboard data.

**Query Parameters:**
- `include_notifications` (bool, default: true)
- `include_ai_nudge` (bool, default: true)

**Response:**
```json
{
  "readiness": {
    "score": 67.4,
    "time_to_ready": 89,
    "trend_7d": "+2.1",
    "gaps": ["DFIR", "Python", "Compliance"]
  },
  "today": {
    "primary_action": {
      "type": "mission",
      "title": "Build SIEM dashboard",
      "priority": "high",
      "cta": "/missions/123/start",
      "est_hours": 4
    },
    "secondary_actions": [...]
  },
  "quick_stats": {...},
  "cards": {...},
  "notifications": {...},
  "leaderboard": {...},
  "ai_nudge": "...",
  "last_updated": "2025-12-03T16:40:00Z"
}
```

### POST `/api/v1/student/dashboard/action`

Track user actions and trigger dashboard updates.

**Request:**
```json
{
  "action": "mission_started",
  "mission_id": "uuid",
  "estimated_completion": "2025-12-04T10:00:00Z"
}
```

**Response:**
```json
{
  "status": "queued",
  "action": "mission_started",
  "priority": "normal"
}
```

### GET `/api/v1/student/dashboard/stream`

Server-Sent Events (SSE) stream for real-time dashboard updates.

**Response:** `text/event-stream`
```
data: {"readiness": {"score": 67.4}, "missions_in_review": 2, ...}
```

## Background Workers

### Management Command

Run dashboard refresh worker:

```bash
python manage.py refresh_dashboards
```

**Options:**
- `--queue-only`: Only process update queue
- `--stale-only`: Only refresh stale dashboards

### Cron Setup

Add to crontab for periodic refresh (every 5 minutes):

```bash
*/5 * * * * cd /path/to/django_app && python manage.py refresh_dashboards
```

### Celery Integration (Optional)

Replace `tasks.py` functions with Celery tasks:

```python
from celery import shared_task

@shared_task
def refresh_student_dashboard(user_id):
    # ... existing logic
```

## Database Schema

### `student_dashboard_cache`

Denormalized cache table with all dashboard metrics:
- Readiness scores and gaps
- Coaching OS summary (habits, goals)
- Missions status
- Portfolio health
- Cohort/calendar info
- Leaderboard rankings
- Notifications counts
- AI coach nudges
- Subscription info
- Real-time flags

### `dashboard_update_queue`

Prioritized queue for background refresh jobs:
- `priority`: urgent, high, normal, low
- `reason`: Event that triggered update
- `queued_at`, `processed_at`: Timestamps

## Service Integration

Services are currently mocked in `services.py`. Replace with actual HTTP clients:

```python
# Example: Replace TalentScopeService.get_readiness()
import requests

def get_readiness(user_id):
    response = requests.get(
        f"{TALENTSCOPE_SERVICE_URL}/readiness/{user_id}",
        headers={"Authorization": f"Bearer {service_token}"}
    )
    return response.json()
```

## Testing

Run tests:

```bash
python manage.py test student_dashboard
```

Test coverage target: **80%+**

## Performance

- **P95 Latency**: <100ms (cached responses)
- **Cache Hit Rate**: >95% (target)
- **Queue Depth**: Alert if >1000
- **Refresh Worker Lag**: <5min

## Monitoring

Key metrics to track:
- `dashboard_cache_hit_rate`
- `dashboard_p95_latency`
- `queue_depth`
- `refresh_worker_lag`
- `readiness_score_staleness`

## Edge Cases Handled

1. **Cold start**: Fallback to live service calls + cache warm
2. **Stale data**: Auto-refresh if `updated_at > 15min`
3. **Free tier**: Mask premium fields → `null` or `"upgrade_required"`
4. **Enhanced access expiring**: Add `"warning"` banner
5. **No cohort assigned**: Show `"Join cohort"` CTA

## Security

- JWT authentication required
- Student role required for access
- View-level permissions (RLS at DB level optional)
- Tier-based field masking

## Deployment

1. Run migrations:
```bash
python manage.py migrate student_dashboard
```

2. Set up background worker (cron or Celery)

3. Configure service URLs in environment:
```bash
TALENTSCOPE_SERVICE_URL=http://...
COACHING_OS_SERVICE_URL=http://...
# ... etc
```

4. Monitor queue depth and refresh lag

## Future Enhancements

- [ ] Replace mock services with actual HTTP clients
- [ ] Add Redis caching layer for even faster responses
- [ ] Implement database-level RLS policies
- [ ] Add GraphQL endpoint for flexible queries
- [ ] WebSocket support for bidirectional real-time updates


