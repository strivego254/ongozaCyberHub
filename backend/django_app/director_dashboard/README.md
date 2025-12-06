# Director Dashboard Setup Guide

## ✅ Completed Setup

### 1. Migrations Applied
```bash
python manage.py migrate director_dashboard
```
✅ Tables created: `director_dashboard_cache`, `director_cohort_health`
✅ RLS policies enabled

### 2. Cache Refresh Command
```bash
# Refresh all director caches
python manage.py refresh_director_cache --all

# Refresh specific director
python manage.py refresh_director_cache --director-id <id>
```

### 3. Celery Configuration

**Beat Schedule (5-minute cadence):**
- Task: `director_dashboard.refresh_all_caches`
- Schedule: Every 5 minutes
- Location: `director_dashboard/celery_config.py`

**Start Workers:**
```bash
# Terminal 1: Celery Worker
celery -A core worker -l info

# Terminal 2: Celery Beat (scheduler)
celery -A core beat -l info
```

### 4. API Endpoints

**Dashboard:**
- `GET /api/v1/director/dashboard/dashboard/` - Full dashboard data
- `GET /api/v1/director/dashboard/cohorts/?risk_level=high&limit=20` - Filtered cohorts
- `POST /api/v1/director/dashboard/refresh_cache/` - Manual cache refresh

### 5. Performance Monitoring

**Metrics Tracked:**
- API response times (decorator: `@track_performance`)
- Cache hit rates
- Error rates

**View Stats:**
```python
from director_dashboard.monitoring import get_cache_stats
stats = get_cache_stats()
print(f"Cache hit rate: {stats['hit_rate']}%")
```

## 🎯 Testing

### Test Dashboard
1. Login as director user: `director@test.com` / `testpass123`
2. Navigate to: `http://localhost:3000/dashboard/director/dashboard`
3. Verify:
   - Hero metrics display
   - Alerts show (if any)
   - Cohorts table loads
   - Quick actions sidebar visible

### Test API
```bash
# Get JWT token
TOKEN=$(python manage.py shell -c "from rest_framework_simplejwt.tokens import RefreshToken; from django.contrib.auth import get_user_model; User = get_user_model(); user = User.objects.filter(email='director@test.com').first(); token = RefreshToken.for_user(user); print(token.access_token)")

# Test dashboard endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/director/dashboard/dashboard/
```

## 📊 Performance Targets

- ✅ Hero loads <200ms (cached)
- ✅ Cohort table 1000+ rows <300ms with filters
- ✅ Cache refresh completes in <30s for all directors
- ✅ RLS 100% (no data leaks)

## 🔧 Troubleshooting

**Cache not refreshing:**
- Check Celery worker is running
- Verify Redis connection
- Check logs: `celery -A core worker -l debug`

**No data showing:**
- Run: `python manage.py refresh_director_cache --all`
- Verify director has cohorts assigned
- Check RLS policies are correct

**Slow performance:**
- Check cache hit rate
- Verify indexes on `director_cohort_health`
- Monitor database query times

