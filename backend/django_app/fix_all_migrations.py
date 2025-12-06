#!/usr/bin/env python
"""
Fix all migration state inconsistencies.
Removes incorrectly applied migrations so we can apply in correct order.
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

def fix_migration_state():
    """Remove incorrectly applied migrations."""
    with connection.cursor() as cursor:
        # List all student_dashboard migrations
        cursor.execute("""
            SELECT id, app, name 
            FROM django_migrations 
            WHERE app = 'student_dashboard' 
            ORDER BY name;
        """)
        current = cursor.fetchall()
        
        print("Current student_dashboard migrations in database:")
        for id, app, name in current:
            print(f"  ID: {id} - {name}")
        
        # Remove any RLS policies migrations that shouldn't be there
        print("\nCleaning up migration state...")
        
        # Remove 0002_add_rls_policies if it exists (should be 0003)
        cursor.execute("""
            DELETE FROM django_migrations 
            WHERE app = 'student_dashboard' 
            AND name = '0002_add_rls_policies';
        """)
        removed1 = cursor.rowcount
        
        # Remove 0003_add_rls_policies if it exists (will be reapplied)
        cursor.execute("""
            DELETE FROM django_migrations 
            WHERE app = 'student_dashboard' 
            AND name = '0003_add_rls_policies';
        """)
        removed2 = cursor.rowcount
        
        print(f"Removed {removed1 + removed2} incorrect migration record(s)")
        
        # Verify final state
        cursor.execute("""
            SELECT app, name 
            FROM django_migrations 
            WHERE app = 'student_dashboard' 
            ORDER BY name;
        """)
        after = cursor.fetchall()
        print("\nFinal student_dashboard migrations in database:")
        for app, name in after:
            print(f"  - {name}")
        
        if len(after) == 0 or (len(after) == 1 and after[0][1] == '0001_initial'):
            print("\n✅ Migration state cleaned! You can now run: python manage.py migrate")
        else:
            print(f"\n⚠️  Still have {len(after)} migration(s) in database")

if __name__ == '__main__':
    try:
        fix_migration_state()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
