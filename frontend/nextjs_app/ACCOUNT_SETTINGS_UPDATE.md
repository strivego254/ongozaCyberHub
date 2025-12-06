# Account Settings Page Update

## Overview

Updated the director account settings page to include comprehensive account management features: profile information updates, password reset, profile picture upload, and session logout.

## Features Implemented

### 1. Profile Information Management
- **Update Fields**: First name, last name, email, phone number, bio, country, timezone, language
- **Real-time Updates**: Changes are immediately reflected in the UI after saving
- **Database Sync**: All updates are saved to the backend database
- **Validation**: Form validation before submission
- **Reset Function**: Ability to reset form to original values

### 2. Password Change
- **Secure Password Change**: Requires current password verification
- **Password Validation**: Minimum 8 characters, password confirmation matching
- **Error Handling**: Clear error messages for invalid passwords
- **Audit Logging**: Password changes are logged in audit history
- **Success Feedback**: Confirmation message on successful password change

### 3. Profile Picture Upload
- **File Upload**: Support for JPEG, PNG, GIF, WebP formats
- **File Size Limit**: Maximum 5MB file size
- **Preview**: Real-time preview of uploaded image
- **Fallback Avatar**: Initials displayed when no picture is set
- **Database Update**: Avatar URL saved to user profile
- **Media Storage**: Files stored in Django media directory

### 4. Session Management
- **Logout**: Secure logout with confirmation dialog
- **Session Termination**: Clears authentication tokens
- **Redirect**: Redirects to login page after logout

### 5. Account Update History
- **Audit Logs**: Display of all account update activities
- **Change Tracking**: Shows what fields were changed (old → new values)
- **Timestamp**: Shows when each change occurred
- **IP Address**: Logs IP address for security tracking
- **Action Types**: Tracks create, update, delete, password_change, etc.

## UI/UX Improvements

### Tab-Based Navigation
- **Profile Info Tab**: Edit account information
- **Password Tab**: Change password
- **Profile Picture Tab**: Upload/update avatar
- **Visual Indicators**: Active tab highlighted with mint color

### Visual Feedback
- **Success Messages**: Green notifications for successful operations
- **Error Messages**: Orange notifications for errors
- **Loading States**: Disabled buttons and loading text during operations
- **Status Badges**: Color-coded badges for account status, email verification, MFA, etc.

### Responsive Design
- **Grid Layout**: 2-column layout on desktop, single column on mobile
- **Sidebar**: Current account info displayed in sidebar
- **Profile Picture Preview**: Large preview in sidebar and upload section

## Backend Endpoints

### New Endpoints Added

1. **POST /api/v1/users/change_password/**
   - Change password for authenticated user
   - Requires: `old_password`, `new_password`
   - Returns: Success message
   - Logs: Password change in audit log

2. **POST /api/v1/users/upload_avatar/**
   - Upload profile picture
   - Requires: `avatar` (file upload)
   - Validates: File type (JPEG, PNG, GIF, WebP) and size (max 5MB)
   - Returns: `avatar_url` and success message
   - Logs: Avatar update in audit log

### Existing Endpoints Used

1. **PATCH /api/v1/users/{id}/**
   - Update user profile information
   - Accepts: first_name, last_name, email, bio, phone_number, country, timezone, language
   - Returns: Updated user object

2. **GET /api/v1/auth/me/**
   - Get current user profile
   - Returns: Complete user object with roles, consents, entitlements

3. **GET /api/v1/audit-logs/**
   - Get audit logs for user
   - Filters: resource_type='user', resource_id=user.id

4. **POST /api/v1/auth/logout/**
   - Logout current session
   - Clears authentication tokens

## File Structure

### Backend Files Modified
- `backend/django_app/users/views/user_views.py`
  - Added `change_password` action
  - Added `upload_avatar` action
  - Added file validation and storage logic
  - Added audit logging

### Frontend Files Modified
- `frontend/nextjs_app/app/dashboard/director/settings/page.tsx`
  - Complete redesign with tab navigation
  - Profile information form
  - Password change form
  - Profile picture upload interface
  - Enhanced UI/UX with OCH branding

## Data Flow

### Profile Update Flow
1. User edits form fields
2. Clicks "Save Changes"
3. Frontend sends PATCH request to `/api/v1/users/{id}/`
4. Backend validates and updates user model
5. Backend logs change in audit log
6. Frontend receives updated user object
7. Frontend reloads user data via `reloadUser()`
8. UI updates with new information

### Password Change Flow
1. User enters current password, new password, and confirmation
2. Frontend validates passwords match and meet requirements
3. Clicks "Change Password"
4. Frontend sends POST request to `/api/v1/users/change_password/`
5. Backend verifies current password
6. Backend validates new password strength
7. Backend updates password and logs change
8. Frontend shows success message and clears form

### Avatar Upload Flow
1. User clicks "Choose File"
2. File picker opens
3. User selects image file
4. Frontend validates file type and size
5. Frontend creates FormData with file
6. Frontend sends POST request to `/api/v1/users/upload_avatar/`
7. Backend validates file type and size
8. Backend saves file to media storage
9. Backend updates user.avatar_url
10. Backend logs change in audit log
11. Frontend receives avatar_url
12. Frontend reloads user data
13. UI updates with new avatar

## Security Features

1. **Password Verification**: Old password required before change
2. **Password Validation**: Django password validators enforced
3. **File Validation**: File type and size restrictions
4. **Audit Logging**: All changes tracked with timestamps and IP addresses
5. **Authentication Required**: All endpoints require authentication
6. **User Isolation**: Users can only update their own profile

## Error Handling

### Frontend Error Handling
- Form validation before submission
- API error messages displayed to user
- Network error handling
- File validation errors
- Password mismatch detection

### Backend Error Handling
- Invalid password verification
- File type validation
- File size validation
- Database error handling
- Proper HTTP status codes

## Testing Checklist

- [x] Profile information can be updated
- [x] Updated information displays immediately
- [x] Password can be changed with old password verification
- [x] Password validation works correctly
- [x] Profile picture can be uploaded
- [x] Profile picture displays after upload
- [x] File type validation works
- [x] File size validation works
- [x] Logout works correctly
- [x] Audit logs display correctly
- [x] Error messages display properly
- [x] Success messages display properly
- [x] Form reset works
- [x] Tab navigation works
- [x] Responsive design works on mobile

## Future Enhancements

### Potential Improvements
- [ ] Image cropping tool for profile pictures
- [ ] Two-factor authentication management
- [ ] Email verification resend
- [ ] Account deletion
- [ ] Export user data (GDPR compliance)
- [ ] Session management (view active sessions)
- [ ] API key management
- [ ] Notification preferences

## Notes

- All updates are immediately reflected in the UI
- Profile picture URLs are stored in the database
- Media files are served from Django media directory
- Audit logs provide complete change history
- OCH brand colors and styling applied throughout
- Responsive design works on all screen sizes


