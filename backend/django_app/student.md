[0;32m╔══════════════════════════════════════════════════════════╗[0m
[0;32m║   Ongoza CyberHub API Endpoint Testing                  ║[0m
[0;32m╚══════════════════════════════════════════════════════════╝[0m

Base URL: http://localhost:8000/api/v1
Testing role: student


[0;32m╔════════════════════════════════════════╗[0m
[0;32m║   AUTHENTICATION ENDPOINT TESTS        ║[0m
[0;32m╚════════════════════════════════════════╝[0m

[1;33m1. Test signup (/auth/signup)[0m
{
  "detail": "Account created. Please verify your email.",
  "user_id": 48
}
[0;32m✓ Success[0m

[1;33m2. Test login (/auth/login)[0m
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0MjUwODI5LCJpYXQiOjE3NjQyNDk5MjksImp0aSI6IjMxMTkwNmY2MGJhODQxNzFiMWI3MDA4OWZlZDE2ZDY0IiwidXNlcl9pZCI6IjMyIiwiYXVkIjoib25nb3phY3liZXJodWIiLCJpc3MiOiJvbmdvemFjeWJlcmh1YiJ9.Iw4R2gXdOS9hbfL_o_IGnThxT-rO-lYQL03YNkH86Ag",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2Njg0MTkyOSwiaWF0IjoxNzY0MjQ5OTI5LCJqdGkiOiI4NWIyNmMwZGQ4Njg0N2NjOTYyOWE4NjY3NGFlZDM2YSIsInVzZXJfaWQiOiIzMiIsImF1ZCI6Im9uZ296YWN5YmVyaHViIiwiaXNzIjoib25nb3phY3liZXJodWIifQ.hSV1cPBZ4PNkPOiGXCb5FcTwrNEX3VilQAFiLCeDvWM",
  "user": {
    "id": 32,
    "email": "student@test.com",
    "username": "student",
    "first_name": "Student",
    "last_name": "User",
    "bio": null,
    "avatar_url": null,
    "phone_number": null,
    "country": null,
    "timezone": "UTC",
    "language": "en",
    "cohort_id": null,
    "track_key": null,
    "org_id": null,
    "account_status": "active",
    "email_verified": true,
    "mfa_enabled": false,
    "risk_level": "low",
    "is_active": true,
    "created_at": "2025-11-27T12:54:25.613718Z",
    "updated_at": "2025-11-27T13:25:29.104331Z",
    "roles": [
      {
        "role": "student",
        "scope": "global",
        "scope_ref": null
      }
    ],
    "consent_scopes": [],
    "entitlements": [],
    "preferred_learning_style": null,
    "career_goals": null,
    "cyber_exposure_level": null
  },
  "consent_scopes": []
}
[0;32m✓ Login successful[0m

[0;32m=== Authentication Tests Complete ===[0m

[0;36m╔════════════════════════════════════════╗[0m
[0;36m║   STUDENT ENDPOINT TESTS               ║[0m
[0;36m╚════════════════════════════════════════╝[0m

[0;32m✓ Student authenticated (token: eyJhbGciOiJIUzI1NiIs...)[0m

[0;34m=== Testing Common Endpoints (student) ===[0m

[1;33m1. Get current user profile (/auth/me)[0m
{
  "user": {
    "id": "32",
    "email": "student@test.com",
    "name": "Student User"
  },
  "roles": [
    {
      "role": "student",
      "scope": "global",
      "scope_ref": null
    }
  ],
  "consent_scopes": [],
  "entitlements": []
}
[0;32m✓ Success[0m

[1;33m2. List available roles (/roles/)[0m
{
  "count": 8,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "admin",
      "display_name": "Admin",
      "description": "Full platform admin; manage roles/policies, tenants, secrets",
      "is_system_role": true,
      "created_at": "2025-11-24T08:52:34.484377Z",
      "updated_at": "2025-11-24T08:52:34.484390Z"
    },
    {
      "id": 7,
      "name": "analyst",
      "display_name": "Analyst",
      "description": "Analytics read with RLS/CLS; no PII without scope",
      "is_system_role": true,
      "created_at": "2025-11-24T08:52:34.541487Z",
      "updated_at": "2025-11-24T08:52:34.541525Z"
    },
    {
      "id": 5,
      "name": "finance",
      "display_name": "Finance",
      "description": "Access billing/revenue, refunds, sponsorship wallets; no student PII beyond billing",
      "is_system_role": true,
      "created_at": "2025-11-24T08:52:34.524876Z",
      "updated_at": "2025-11-24T08:52:34.524892Z"
    },
    {
      "id": 8,
      "name": "mentee",
      "display_name": "Mentee",
      "description": "Primary user role for mentees in the OCH ecosystem (Tier 0 and Tier 1)",
      "is_system_role": true,
      "created_at": "2025-11-27T09:02:44.085178Z",
      "updated_at": "2025-11-27T09:02:44.085207Z"
    },
    {
      "id": 3,
      "name": "mentor",
      "display_name": "Mentor",
      "description": "Access assigned mentees; create notes; review portfolios; limited analytics",
      "is_system_role": true,
      "created_at": "2025-11-24T08:52:34.510275Z",
      "updated_at": "2025-11-24T08:52:34.510290Z"
    },
    {
      "id": 2,
      "name": "program_director",
      "display_name": "Program Director",
      "description": "Manage programs/cohorts/tracks; view analytics; assign mentors",
      "is_system_role": true,
      "created_at": "2025-11-24T08:52:34.500260Z",
      "updated_at": "2025-11-24T08:52:34.500274Z"
    },
    {
      "id": 6,
      "name": "sponsor_admin",
      "display_name": "Sponsor/Employer Admin",
      "description": "Manage sponsored users, view permitted profiles per consent",
      "is_system_role": true,
      "created_at": "2025-11-24T08:52:34.532186Z",
      "updated_at": "2025-11-24T08:52:34.532200Z"
    },
    {
      "id": 4,
      "name": "student",
      "display_name": "Student",
      "description": "Access personal modules (profiling, learning, portfolio, mentorship)",
      "is_system_role": true,
      "created_at": "2025-11-24T08:52:34.516708Z",
      "updated_at": "2025-11-24T08:52:34.516723Z"
    }
  ]
}
[0;32m✓ Success[0m

[1;33m3. List organizations (/orgs/)[0m
{
  "count": 0,
  "next": null,
  "previous": null,
  "results": []
}
[0;32m✓ Success[0m


[1;33m4. Attempt to list all users (/users/) - Should be restricted[0m
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 32,
      "email": "student@test.com",
      "username": "student",
      "first_name": "Student",
      "last_name": "User",
      "bio": null,
      "avatar_url": null,
      "phone_number": null,
      "country": null,
      "timezone": "UTC",
      "language": "en",
      "cohort_id": null,
      "track_key": null,
      "org_id": null,
      "account_status": "active",
      "email_verified": true,
      "mfa_enabled": false,
      "risk_level": "low",
      "is_active": true,
      "created_at": "2025-11-27T12:54:25.613718Z",
      "updated_at": "2025-11-27T13:25:29.273275Z",
      "roles": [
        {
          "role": "student",
          "scope": "global",
          "scope_ref": null
        }
      ],
      "consent_scopes": [],
      "entitlements": [],
      "preferred_learning_style": null,
      "career_goals": null,
      "cyber_exposure_level": null
    }
  ]
}
[1;33mNote: Student has access (may be limited to own profile)[0m

[1;33m5. Attempt to access audit logs (/audit-logs/) - Should be restricted[0m
{
  "count": 22,
  "next": "http://localhost:8000/api/v1/audit-logs/?page=2",
  "previous": null,
  "results": [
    {
      "id": 89,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:25:29.275539Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 88,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:25:29.108044Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 86,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:23:12.051279Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 85,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:23:11.879091Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 83,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:21:17.325405Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 82,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:21:17.179427Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 80,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:21:02.565372Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 79,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:21:02.405083Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 77,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:16:30.892847Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 76,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:16:30.705405Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 74,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:14:06.709452Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 73,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:14:06.558080Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 71,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:13:20.736087Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 70,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:13:20.568088Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 68,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:10:34.440619Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 67,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:10:34.277289Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 65,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:10:30.554464Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 64,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:10:30.279378Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 62,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:06:17.718915Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.0,
        "mfa_required": false
      },
      "result": "success"
    },
    {
      "id": 60,
      "actor_type": "user",
      "actor_identifier": "student@test.com",
      "action": "login",
      "resource_type": "user",
      "resource_id": null,
      "timestamp": "2025-11-27T13:00:51.758284Z",
      "ip_address": null,
      "user_agent": null,
      "metadata": {
        "method": "password",
        "risk_score": 0.3,
        "mfa_required": false
      },
      "result": "success"
    }
  ]
}
[1;33mNote: Student has unexpected access to audit logs[0m

[1;33m6. List progress (/progress/) - Student access[0m
{
  "count": 0,
  "next": null,
  "previous": null,
  "results": []
}
[0;32m✓ Success[0m

[0;32m=== Student Tests Complete ===[0m

[0;32m╔══════════════════════════════════════════════════════════╗[0m
[0;32m║   All Tests Complete                                    ║[0m
[0;32m╚══════════════════════════════════════════════════════════╝[0m

Test users (password: testpass123):
  - admin@test.com (Admin)
  - student@test.com (Student)
  - mentor@test.com (Mentor)
  - director@test.com (Program Director)

