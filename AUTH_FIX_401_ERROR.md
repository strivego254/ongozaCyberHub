# Fix for 401 Unauthorized Error on /api/v1/auth/me

## Problem

The frontend was getting 401 Unauthorized errors when trying to access `/api/v1/auth/me` because:

1. **HttpOnly Cookies**: The login API route was setting tokens in HttpOnly cookies, which JavaScript cannot read
2. **Token Not Sent**: The `fetcher` function couldn't read the HttpOnly cookie, so the Authorization header wasn't being set
3. **Middleware Redirect Loop**: The middleware was checking for cookies that weren't accessible to client-side code

## Solution

### Changes Made

1. **Login API Route** (`app/api/auth/login/route.ts`):
   - Now returns `access_token` and `refresh_token` in the response
   - Client can store `access_token` in localStorage
   - Server still sets cookies (access_token non-HttpOnly, refresh_token HttpOnly)

2. **Auth Hook** (`hooks/useAuth.ts`):
   - Stores tokens in localStorage after login
   - Ensures tokens are available for API calls

3. **Auth Server Utils** (`utils/auth-server.ts`):
   - Changed `access_token` cookie to `httpOnly: false` so client can read it
   - `refresh_token` remains HttpOnly for security

4. **Fetcher** (`utils/fetcher.ts`):
   - Checks localStorage first (most reliable)
   - Falls back to cookie if localStorage is empty
   - Stores cookie value in localStorage for consistency

5. **Middleware** (`middleware.ts`):
   - Removed redirect for protected routes (prevents loops)
   - Client-side will handle authentication checks
   - Still redirects auth routes if token exists

## Token Storage Strategy

- **Access Token (15 min lifetime)**:
  - Stored in localStorage (client-accessible)
  - Also set in non-HttpOnly cookie (for SSR if needed)
  - Sent in `Authorization: Bearer {token}` header

- **Refresh Token (30 days lifetime)**:
  - Stored in localStorage (backup)
  - Set in HttpOnly cookie (primary, more secure)
  - Used for token refresh

## Testing

After these changes:

1. **Login**: Should store tokens and redirect to dashboard
2. **API Calls**: Should include Authorization header with access token
3. **Token Refresh**: Should work automatically when access token expires
4. **Logout**: Should clear all tokens

## Next Steps

If you still see 401 errors:

1. **Check Browser Console**: Look for token storage/retrieval errors
2. **Check Network Tab**: Verify Authorization header is being sent
3. **Verify Token**: Check if token exists in localStorage
4. **Check Token Expiry**: Access tokens expire after 15 minutes - refresh should happen automatically

## Debugging

To debug token issues:

```javascript
// In browser console
console.log('Access Token:', localStorage.getItem('access_token'));
console.log('Refresh Token:', localStorage.getItem('refresh_token'));
console.log('Cookies:', document.cookie);
```

If tokens are missing, try logging in again.






