[1;33mNote: jq not found. Using basic JSON parsing. Install jq for better output.[0m

[0;32m╔══════════════════════════════════════════════════════════╗[0m
[0;32m║   Ongoza CyberHub API Endpoint Testing                  ║[0m
[0;32m╚══════════════════════════════════════════════════════════╝[0m

Base URL: http://localhost:8000/api/v1
Testing role: student


[0;32m╔════════════════════════════════════════╗[0m
[0;32m║   AUTHENTICATION ENDPOINT TESTS        ║[0m
[0;32m╚════════════════════════════════════════╝[0m

[1;33m1. Test signup (/auth/signup)[0m
{"detail":"Account created. Please verify your email.","user_id":25}
[0;32m✓ Success[0m

[1;33m2. Test login (/auth/login)[0m
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0MjQ3MDA5LCJpYXQiOjE3NjQyNDYxMDksImp0aSI6Ijc3OWQyMTQxZDczYjQ2ZjdhYTk2ZTIyZjUzMzg5OGVjIiwidXNlcl9pZCI6IjUiLCJhdWQiOiJvbmdvemFjeWJlcmh1YiIsImlzcyI6Im9uZ296YWN5YmVyaHViIn0.5G-3XEEDpJmIJmUfis1CcTUiOR5_zkeGV8psNEu57Iw","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NjgzODEwOSwiaWF0IjoxNzY0MjQ2MTA5LCJqdGkiOiI5Y2FhODk1ZWE4MmM0NDFlOGZlOWNlMTBhNzIyMGE1YSIsInVzZXJfaWQiOiI1IiwiYXVkIjoib25nb3phY3liZXJodWIiLCJpc3MiOiJvbmdvemFjeWJlcmh1YiJ9.mbm9Rrbc69ImK5puckT9nP4va1RV9btUdT1kbfj4zZs","user":{"id":5,"email":"student@test.com","username":"student","first_name":"Student","last_name":"User","bio":null,"avatar_url":null,"phone_number":null,"country":null,"timezone":"UTC","language":"en","cohort_id":null,"track_key":null,"org_id":null,"account_status":"active","email_verified":true,"mfa_enabled":false,"risk_level":"low","is_active":true,"created_at":"2025-11-27T06:52:57.531184Z","updated_at":"2025-11-27T12:21:49.170699Z","roles":[{"role":"student","scope":"global","scope_ref":null}],"consent_scopes":[],"entitlements":[],"preferred_learning_style":null,"career_goals":null,"cyber_exposure_level":null},"consent_scopes":[]}
[0;32m✓ Login successful[0m

[0;32m=== Authentication Tests Complete ===[0m

[0;36m╔════════════════════════════════════════╗[0m
[0;36m║   STUDENT ENDPOINT TESTS               ║[0m
[0;36m╚════════════════════════════════════════╝[0m

[0;32m✓ Student authenticated[0m

[0;34m=== Testing Common Endpoints (student) ===[0m

[1;33m1. Get current user profile (/auth/me)[0m
{"detail":"Authorization header must contain two space-delimited values","code":"bad_authorization_header"}
[0;32m✓ Success[0m

[1;33m2. List available roles (/roles/)[0m
[1;33m3. List organizations (/orgs/)[0m

[1;33m4. Attempt to list all users (/users/) - Should be restricted[0m
{"detail":"Authorization header must contain two space-delimited values","code":"bad_authorization_header"}
[1;33mNote: Student has access (may be limited to own profile)[0m

[1;33m5. Attempt to access audit logs (/audit-logs/) - Should be restricted[0m
[1;33mExpected:[0m Student access restricted - Authorization header must contain two space-delimited values

[1;33m6. List progress (/progress/) - Student access[0m
[0;32m=== Student Tests Complete ===[0m

[0;32m╔══════════════════════════════════════════════════════════╗[0m
[0;32m║   All Tests Complete                                    ║[0m
[0;32m╚══════════════════════════════════════════════════════════╝[0m

Test users (password: testpass123):
  - admin@test.com (Admin)
  - student@test.com (Student)
  - mentor@test.com (Mentor)
  - director@test.com (Program Director)

