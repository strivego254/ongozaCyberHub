# Generated manually to fix story column NOT NULL constraint
from django.db import migrations


def fix_story_column(apps, schema_editor):
    """Make story column nullable or add default value."""
    db_table = 'missions'
    
    with schema_editor.connection.cursor() as cursor:
        # Check if story column exists
        cursor.execute("""
            SELECT column_name, is_nullable
            FROM information_schema.columns 
            WHERE table_name = %s AND column_name = 'story'
        """, [db_table])
        
        result = cursor.fetchone()
        if result:
            column_name, is_nullable = result
            if is_nullable == 'NO':
                # Column exists but is NOT NULL, make it nullable
                cursor.execute("""
                    ALTER TABLE missions 
                    ALTER COLUMN story DROP NOT NULL
                """)
                print("✅ Made 'story' column nullable in missions table")
            else:
                print("✅ 'story' column is already nullable")
        else:
            print("⚠️ 'story' column does not exist in missions table")


def reverse_fix_story_column(apps, schema_editor):
    """Reverse migration - make story column NOT NULL (with default)."""
    db_table = 'missions'
    
    with schema_editor.connection.cursor() as cursor:
        # Check if story column exists
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns 
            WHERE table_name = %s AND column_name = 'story'
        """, [db_table])
        
        if cursor.fetchone():
            # Set default empty string for existing NULL values, then make NOT NULL
            cursor.execute("""
                UPDATE missions SET story = '' WHERE story IS NULL
            """)
            cursor.execute("""
                ALTER TABLE missions 
                ALTER COLUMN story SET NOT NULL,
                ALTER COLUMN story SET DEFAULT ''
            """)
            print("✅ Made 'story' column NOT NULL with default ''")


class Migration(migrations.Migration):

    dependencies = [
        ('missions', '0006_add_estimated_time_minutes_column'),
    ]

    operations = [
        migrations.RunPython(
            fix_story_column,
            reverse_code=reverse_fix_story_column
        ),
    ]
















