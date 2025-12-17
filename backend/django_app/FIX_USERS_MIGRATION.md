# Fix Users Migration Issue

## Problem
The `users` app has no migration files, but other apps (like `subscriptions`) depend on it, causing:
```
ValueError: Dependency on app with no migrations: users
```

## Solution

Run these commands in order:

```bash
cd backend/django_app

# 1. Create initial migration for users app
python manage.py makemigrations users

# 2. Create migrations for subscriptions (if needed)
python manage.py makemigrations subscriptions

# 3. Run all migrations
python manage.py migrate
```

## If you get errors

If you still get dependency errors, you may need to create migrations in this order:

```bash
# 1. Users first (no dependencies)
python manage.py makemigrations users --name initial

# 2. Organizations (depends on users)
python manage.py makemigrations organizations

# 3. Subscriptions (depends on users)
python manage.py makemigrations subscriptions

# 4. Other apps
python manage.py makemigrations

# 5. Run migrations
python manage.py migrate
```

## Verify

After running migrations, verify with:
```bash
python manage.py showmigrations
```

All apps should show `[X]` for applied migrations.

















