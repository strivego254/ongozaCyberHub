# Student Missions Testing Guide

## Complete Flow Test

### Prerequisites
1. All services running (Django, FastAPI, PostgreSQL, Frontend)
2. User authenticated as student
3. User has active track enrollment

### Test Flow

#### 1. View Missions
- Navigate to `/dashboard/student/missions`
- Verify funnel strip shows counts by status
- Verify priority missions are displayed
- Verify full mission list with filters

#### 2. Start Mission
- Click on a mission card
- Mission Detail drawer opens
- Verify mission brief, objectives, competencies displayed
- Click "Start Mission" or "Continue"
- Submission created with status `not_started` or `in_progress`

#### 3. Upload Artifacts
- In Mission Detail, upload files via ArtifactUpload component
- Add GitHub URL, Notebook URL, or Video URL
- Verify artifacts appear in submission
- Save draft

#### 4. Submit for AI Review
- Click "Submit for AI Review"
- Submission status changes to `submitted`
- Background task `process_mission_ai_review` is triggered
- Wait for AI review (check task queue/logs)
- Status changes to `ai_reviewed`
- AI feedback appears in Mission Detail

#### 5. View AI Feedback
- Verify AI score displayed
- Verify strengths, gaps, suggestions listed
- Verify competencies detected
- Verify full feedback structure

#### 6. Submit for Mentor Review (Tier 7 only)
- If user tier is 7, "Submit for Mentor Review" button appears
- Click button
- Status changes to `mentor_review`
- Wait for mentor review

#### 7. View Approved Mission
- Once approved, mission shows in portfolio
- Readiness points updated
- Competencies updated in TalentScope

## Navigation Tests

### Curriculum to Missions
- Navigate to `/dashboard/student/curriculum`
- Click on a mission link within a module
- Verify navigation to `/dashboard/student/missions?mission={id}`
- Verify mission detail opens automatically

## Entitlement Tests

### Locked Content
- Test with tier 0 user
- Verify locked missions show upgrade banner
- Verify locked modules show upgrade banner
- Verify locked content cannot be accessed

### Tier-Based Features
- Tier 1: Can start missions
- Tier 3: Can access AI Coach
- Tier 7: Can access mentor review

## Analytics Tests

### Event Tracking
- Submit mission → verify `mission_submitted` event
- Complete lesson → verify `lesson_completed` event
- Log habit → verify `habit_logged` event
- Create goal → verify `goal_created` event
- Create reflection → verify `reflection_created` event

## RLS Tests

### Data Isolation
- Login as User A
- View missions → only see User A's submissions
- Login as User B
- View missions → only see User B's submissions
- Verify User B cannot access User A's data via API

## API Endpoint Tests

### FastAPI Endpoints
```bash
# Mission Funnel
curl http://localhost:8001/api/student/missions/funnel

# List Missions
curl http://localhost:8001/api/student/missions?status=not_started

# Mission Detail
curl http://localhost:8001/api/student/missions/{mission_id}

# Submit for AI
curl -X POST http://localhost:8001/api/student/missions/submissions/{submission_id}/submit-ai
```

### Django Endpoints (called by FastAPI)
```bash
# Mission Funnel
curl http://localhost:8000/api/v1/student/missions/funnel

# List Missions
curl http://localhost:8000/api/v1/student/missions
```

## Expected Results

✅ All missions visible with correct status
✅ Funnel counts accurate
✅ Priority missions displayed
✅ Mission detail shows all information
✅ Artifacts upload successfully
✅ AI review completes and feedback appears
✅ Navigation between curriculum and missions works
✅ Entitlements enforced correctly
✅ Analytics events tracked
✅ RLS prevents cross-user data access

