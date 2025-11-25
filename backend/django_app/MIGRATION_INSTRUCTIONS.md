# Fresh Migration Instructions

## Step 1: Create Migrations

Run migrations in the correct order to avoid circular dependencies:

```bash
cd backend/django_app

# 1. Create users migrations first (no dependency on organizations)
python manage.py makemigrations users --name initial

# 2. Create organizations migrations (depends on users via AUTH_USER_MODEL)
python manage.py makemigrations organizations --name initial

# 3. Create organizations migration for owner field (after users exists)
python manage.py makemigrations organizations --name add_owner_field

# 4. Create progress migrations
python manage.py makemigrations progress --name initial

# 5. Verify all migrations created
python manage.py showmigrations
```

## Step 2: Run Migrations

```bash
python manage.py migrate
```

## Step 3: Seed Initial Data

```bash
# Seed roles and permissions
python manage.py seed_roles_permissions

# Create superuser (optional)
python manage.py createsuperuser
```

## Expected Migration Files

After running makemigrations, you should have:

```
users/migrations/
├── __init__.py
└── 0001_initial.py

organizations/migrations/
├── __init__.py
├── 0001_initial.py
└── 0002_add_owner_field.py

progress/migrations/
├── __init__.py
└── 0001_initial.py
```

## Troubleshooting

If you get circular dependency errors:

1. Ensure users migrations are created first
2. Check that User.org_id is nullable (it is)
3. Organizations should depend on users, not vice versa
4. Delete problematic migrations and recreate in order

## Verification

After migrations:

```bash
python manage.py dbshell
```

```sql
\dt  -- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

Expected tables:
- users
- roles
- permissions
- user_roles
- consent_scopes
- entitlements
- mfa_methods
- mfa_codes
- user_identities
- user_sessions
- device_trust
- organizations
- organization_members
- policies
- api_keys
- webhook_endpoints
- webhook_deliveries
- audit_logs
- data_exports
- data_erasures


