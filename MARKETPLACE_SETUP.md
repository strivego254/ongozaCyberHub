# Marketplace Module Setup & Testing Guide

## ✅ Database Setup Complete

The marketplace migrations have been successfully applied. The following tables are now in your database:
- `marketplace_employers` - Employer company profiles
- `marketplace_profiles` - Mentee marketplace profiles
- `marketplace_employerinterestlogs` - Employer interaction tracking
- `marketplace_jobpostings` - Job/assignment postings

## 🚀 Next Steps

### 1. Create Test Employer Profile

To test the employer functionality, you need to create an employer profile for a user. You can do this via:

**Option A: Django Admin**
1. Go to Django admin: `http://localhost:8000/admin/`
2. Navigate to "Marketplace" → "Employers"
3. Click "Add Employer"
4. Select a user (or create one first)
5. Fill in company details

**Option B: API Endpoint**
```bash
POST /api/v1/marketplace/employer/me
{
  "company_name": "Test Company",
  "website": "https://example.com",
  "sector": "Cybersecurity",
  "country": "Kenya"
}
```

**Option C: Django Shell**
```python
python3 manage.py shell
>>> from users.models import User
>>> from marketplace.models import Employer
>>> user = User.objects.get(email='employer@test.com')  # or create one
>>> employer = Employer.objects.create(
...     user=user,
...     company_name="Test Company",
...     sector="Cybersecurity",
...     country="Kenya"
... )
```

### 2. Create Test Mentee Marketplace Profile

For a student/mentee to appear in the marketplace:

**Option A: Via API (Automatic)**
- When a mentee visits `/dashboard/student/marketplace`, the profile is auto-created
- They need to:
  1. Have a subscription tier (`starter` or `professional`)
  2. Grant `employer_share` consent
  3. Set `is_visible=True`

**Option B: Django Shell**
```python
python3 manage.py shell
>>> from users.models import User, ConsentScope
>>> from marketplace.models import MarketplaceProfile
>>> from subscriptions.utils import get_user_tier
>>> 
>>> mentee = User.objects.get(email='student@test.com')
>>> tier = get_user_tier(mentee.id)
>>> 
>>> # Grant consent
>>> ConsentScope.objects.get_or_create(
...     user=mentee,
...     scope_type='employer_share',
...     defaults={'granted': True}
... )
>>> 
>>> # Create marketplace profile
>>> profile = MarketplaceProfile.objects.get_or_create(
...     mentee=mentee,
...     defaults={
...         'tier': tier,
...         'is_visible': True,
...         'employer_share_consent': True,
...         'profile_status': 'job_ready',
...         'readiness_score': 85,
...         'skills': ['Python', 'Security', 'Cloud'],
...         'portfolio_depth': 'deep'
...     }
... )
```

### 3. Test Frontend Pages

**Employer Dashboard:**
- Navigate to: `http://localhost:3000/dashboard/employer`
- Should show dashboard with links to talent browsing and job postings

**Browse Talent:**
- Navigate to: `http://localhost:3000/dashboard/employer/talent`
- Should show list of visible mentees (if any exist)
- Test filters: skills, readiness, status, contactable-only

**Job Postings:**
- Navigate to: `http://localhost:3000/dashboard/employer/jobs`
- Create a new job posting
- Edit and delete existing postings

**Mentee Marketplace Profile:**
- Navigate to: `http://localhost:3000/dashboard/student/marketplace`
- View career readiness report
- Toggle visibility
- Check tier and consent status

### 4. Test API Endpoints

**Browse Talent (Employer):**
```bash
GET /api/v1/marketplace/talent?contactable_only=true&min_readiness=70
Authorization: Bearer <employer_token>
```

**Get My Profile (Mentee):**
```bash
GET /api/v1/marketplace/profile/me
Authorization: Bearer <mentee_token>
```

**Log Interest:**
```bash
POST /api/v1/marketplace/interest
{
  "profile_id": "<profile_uuid>",
  "action": "favorite",
  "metadata": {}
}
Authorization: Bearer <employer_token>
```

**Create Job Posting:**
```bash
POST /api/v1/marketplace/jobs
{
  "title": "Senior Security Engineer",
  "description": "Looking for experienced security professional...",
  "job_type": "full_time",
  "required_skills": ["Python", "Security", "Cloud"],
  "location": "Nairobi, Kenya",
  "salary_range_min": 50000,
  "salary_range_max": 80000,
  "salary_currency": "USD"
}
Authorization: Bearer <employer_token>
```

## 🔒 Security & Privacy Checks

The marketplace enforces:

1. **Tier-Based Visibility:**
   - Only `starter` and `professional` tier mentees can be visible
   - `free` tier mentees are never shown to employers

2. **Consent Requirements:**
   - Mentees must grant `employer_share` consent
   - Checked via `ConsentScope` model

3. **Employer Authentication:**
   - Only users with `employer_profile` OR `sponsor_admin` role can access employer endpoints

4. **PII Minimization:**
   - Email addresses are only shown when contact is requested
   - Profile data is limited to what's necessary for matching

## 📊 Integration Points

### TalentScope Integration (Future Enhancement)

To automatically update readiness scores, you can add a signal or task:

```python
# In talentscope app or marketplace signals.py
from django.db.models.signals import post_save
from marketplace.models import MarketplaceProfile

def update_marketplace_readiness(sender, instance, **kwargs):
    # Update MarketplaceProfile with latest TalentScope scores
    profile = MarketplaceProfile.objects.filter(mentee=instance.user).first()
    if profile:
        profile.readiness_score = instance.overall_readiness
        profile.job_fit_score = instance.job_fit_score
        profile.hiring_timeline_days = instance.hiring_timeline_days
        profile.save()
```

### Subscription Tier Updates

When a user's subscription changes, update their marketplace profile:

```python
from subscriptions.models import UserSubscription
from marketplace.models import MarketplaceProfile

# In subscription signal or view
profile = MarketplaceProfile.objects.filter(mentee=user).first()
if profile:
    new_tier = get_user_tier(user.id)
    profile.tier = new_tier
    profile.save()
```

## 🐛 Troubleshooting

**Issue: "No talent profiles found"**
- Check that mentees have `is_visible=True`
- Verify `employer_share_consent=True`
- Ensure tier is `starter` or `professional` (not `free`)

**Issue: "403 Forbidden" on employer endpoints**
- Verify user has `employer_profile` OR `sponsor_admin` role
- Check authentication token is valid

**Issue: "Profile not found" for mentee**
- Profile is auto-created on first access to `/marketplace/profile/me`
- Check user has a subscription tier

## 📝 Notes

- Marketplace profiles are automatically created when mentees first access their profile page
- Readiness scores are denormalized from TalentScope (update manually or via signals)
- Job postings are scoped to the employer who created them
- Interest logs track all employer interactions for analytics


