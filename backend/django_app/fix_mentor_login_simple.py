#!/usr/bin/env python
"""
Simple script to update user passwords for login.
Run: python fix_mentor_login_simple.py
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection
from django.contrib.auth.hashers import make_password
from django.utils import timezone

def update_user_password(email, password):
    """Update user password using raw SQL."""
    cursor = connection.cursor()
    hashed_password = make_password(password)
    
    try:
        cursor.execute("""
            UPDATE users 
            SET password = %s,
                account_status = 'active',
                email_verified = true,
                is_active = true
            WHERE email = %s
        """, [hashed_password, email])
        
        if cursor.rowcount > 0:
            connection.commit()
            print(f"✓ Updated password for: {email} -> {password}")
            return True
        else:
            print(f"⚠ User not found: {email}")
            return False
    except Exception as e:
        print(f"❌ Error updating {email}: {e}")
        return False

# Users to update
users_to_update = [
    ('mentor3@test.com', 'yourpassword'),
    ('mentor@test.com', 'yourpassword'),
    ('mentor2@test.com', 'yourpassword'),
    ('student@test.com', 'yourpassword'),
    ('admin@test.com', 'yourpassword'),
    ('sponsor@test.com', 'yourpassword'),
    ('director@test.com', 'yourpassword'),
]

print("=" * 60)
print("Updating User Passwords for Login")
print("=" * 60)

for email, password in users_to_update:
    update_user_password(email, password)

print("\n" + "=" * 60)
print("✅ Password updates complete!")
print("=" * 60)
print("\nYou can now login with:")
print("  - mentor3@test.com / yourpassword")
print("  - mentor@test.com / yourpassword")
print("  - student@test.com / yourpassword")
print("  - admin@test.com / yourpassword")
print("  - sponsor@test.com / yourpassword")

