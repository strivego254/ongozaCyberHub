# Portfolio Items Visibility Fix

## Problem
When students create portfolio items (outcomes) and save them as drafts or submit them, the items don't appear in the portfolio list. This is because:

1. **Missing Backend Endpoint**: The frontend calls `/student/dashboard/portfolio/${userId}` but this endpoint doesn't exist in the backend
2. **No Refetch After Creation**: The form doesn't properly trigger a refetch after creating items
3. **Status Filter**: Items might be hidden by the status filter

## Changes Made

### 1. Enhanced Portfolio Dashboard (`PortfolioDashboard.tsx`)
- ✅ Made status cards clickable to filter by status (Drafts, Submitted, In Review, Approved)
- ✅ Added visual feedback when a status filter is active
- ✅ Enhanced form close handler to trigger refetch

### 2. Improved Form Submission (`PortfolioItemForm.tsx`)
- ✅ Added `refetch` from `usePortfolio` hook
- ✅ Trigger refetch after successful item creation
- ✅ Better timing for UI updates

### 3. Status Filter Improvements
- ✅ Status cards are now clickable buttons
- ✅ Active filter is highlighted
- ✅ Default filter shows "ALL STATUS" to display all items

## What Students Should See

After creating a portfolio item:

1. **Status Cards** at the top show counts:
   - **Drafts**: Items saved as drafts
   - **Submitted**: Items submitted for review
   - **In Review**: Items being reviewed by mentors
   - **Approved**: Items approved and published

2. **Clickable Status Cards**: Click any status card to filter items by that status

3. **Status Dropdown**: Use the "ALL STATUS" dropdown to filter items

4. **Search Bar**: Search for items by title or summary

5. **Grid/List View**: Toggle between grid and list view

## Next Steps (Backend Required)

The frontend expects these endpoints to exist:

```
GET  /api/v1/student/dashboard/portfolio/{userId}
POST /api/v1/student/dashboard/portfolio/{userId}/items
PATCH /api/v1/student/dashboard/portfolio/item/{itemId}
DELETE /api/v1/student/dashboard/portfolio/item/{itemId}
GET  /api/v1/student/dashboard/portfolio/{userId}/health
```

**Current Status**: These endpoints need to be implemented in the backend to fully support portfolio item CRUD operations.

## Temporary Workaround

Until the backend endpoints are implemented:
- Items are stored in local state
- Page refresh may be needed to see new items
- Consider implementing local storage as a temporary solution

## Testing Checklist

- [ ] Create a new portfolio item as draft
- [ ] Verify it appears in the "Drafts" count
- [ ] Click "Drafts" status card to filter
- [ ] Verify the draft item is visible
- [ ] Submit the item
- [ ] Verify it moves to "Submitted" status
- [ ] Check that status counts update correctly
- [ ] Test search functionality
- [ ] Test grid/list view toggle

