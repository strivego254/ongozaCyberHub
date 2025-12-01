# Mock Data Guide for Mentor Dashboard

The mentor dashboard is currently using mock/dummy data for all features. This allows the frontend to be fully functional while the backend endpoints are being developed.

## Current Status

All mentor dashboard features are using mock data:
- ✅ Mentee Management
- ✅ Mission Reviews
- ✅ Capstone Scoring
- ✅ Session Management
- ✅ Goal Feedback
- ✅ Mentee Flagging
- ✅ TalentScope Analytics
- ✅ Mentor Influence Index
- ✅ Profile Management

## Switching to Real Data

When the backend endpoints are ready, follow these steps:

### 1. Update Hook Flags

In each hook file, change the `USE_MOCK_DATA` constant from `true` to `false`:

**Files to update:**
- `hooks/useMentorMentees.ts`
- `hooks/useMentorMissions.ts`
- `hooks/useMentorInfluence.ts`
- `hooks/useMentorProfile.ts`
- `hooks/useMentorSessions.ts`
- `hooks/useMenteeGoals.ts`
- `hooks/useMenteeFlags.ts`
- `hooks/useTalentScopeView.ts`

**Example:**
```typescript
// Change this:
const USE_MOCK_DATA = true

// To this:
const USE_MOCK_DATA = false
```

### 2. Update Component Forms

In form components that submit data, update the `USE_MOCK_DATA` flag:

**Files to update:**
- `components/mentor/MissionReviewForm.tsx`
- `components/mentor/CapstoneScoringForm.tsx`

**Example:**
```typescript
// Change this:
const USE_MOCK_DATA = true

// To this:
const USE_MOCK_DATA = false
```

### 3. Update Missions Page

In `app/dashboard/mentor/missions/page.tsx`, update the `USE_MOCK_DATA` flag for capstone loading.

### 4. Verify Backend Endpoints

Ensure all backend endpoints match the expected API structure defined in:
- `services/mentorClient.ts` - All API method signatures
- `services/types/mentor.ts` - All TypeScript type definitions

### 5. Test Each Feature

After switching to real data, test each feature:
1. Mentee list loading
2. Mission submission queue
3. Mission review submission
4. Capstone scoring
5. Session creation and updates
6. Goal feedback submission
7. Mentee flagging
8. Analytics data loading
9. Profile updates

## Mock Data Location

All mock data is stored in:
- `services/mockData/mentorMockData.ts`

This file contains:
- `mockMentees` - Sample mentee data
- `mockMentorProfile` - Sample mentor profile
- `mockMissionSubmissions` - Sample mission submissions
- `mockCapstoneProjects` - Sample capstone projects
- `mockGroupSessions` - Sample group sessions
- `mockGoals` - Sample mentee goals
- `mockFlags` - Sample mentee flags
- `mockTalentScopeView` - Sample TalentScope data
- `mockInfluenceIndex` - Sample influence analytics

## Environment Variable Alternative

For a more production-ready approach, you can use an environment variable:

```typescript
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
```

Then set in `.env.local`:
```
NEXT_PUBLIC_USE_MOCK_DATA=true
```

When ready for production:
```
NEXT_PUBLIC_USE_MOCK_DATA=false
```

## Notes

- Mock data includes realistic delays (500ms) to simulate API calls
- All mock data follows the same TypeScript types as real data
- Form submissions in mock mode will succeed immediately without API calls
- When switching to real data, ensure error handling is properly tested

