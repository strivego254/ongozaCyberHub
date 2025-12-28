# Generated manually to fix objectives column NOT NULL constraint
from django.db import migrations


def fix_objectives_column(apps, schema_editor):
    """Make objectives column nullable or add default value."""
    db_table = 'missions'
    
    with schema_editor.connection.cursor() as cursor:
        # Check if objectives column exists
        cursor.execute("""
            SELECT column_name, is_nullable
            FROM information_schema.columns 
            WHERE table_name = %s AND column_name = 'objectives'
        """, [db_table])
        
        result = cursor.fetchone()
        if result:
            column_name, is_nullable = result
            if is_nullable == 'NO':
                # Column exists but is NOT NULL, make it nullable
                cursor.execute("""
                    ALTER TABLE missions 
                    ALTER COLUMN objectives DROP NOT NULL
                """)
                print("✅ Made 'objectives' column nullable in missions table")
            else:
                print("✅ 'objectives' column is already nullable")
        else:
            print("⚠️ 'objectives' column does not exist in missions table")


def reverse_fix_objectives_column(apps, schema_editor):
    """Reverse migration - make objectives column NOT NULL (with default)."""
    db_table = 'missions'
    
    with schema_editor.connection.cursor() as cursor:
        # Check if objectives column exists
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns 
            WHERE table_name = %s AND column_name = 'objectives'
        """, [db_table])
        
        if cursor.fetchone():
            # Set default empty string for existing NULL values, then make NOT NULL
            cursor.execute("""
                UPDATE missions SET objectives = '' WHERE objectives IS NULL
            """)
            cursor.execute("""
                ALTER TABLE missions 
                ALTER COLUMN objectives SET NOT NULL,
                ALTER COLUMN objectives SET DEFAULT ''
            """)
            print("✅ Made 'objectives' column NOT NULL with default ''")


class Migration(migrations.Migration):

    dependencies = [
        ('missions', '0007_fix_story_column_constraint'),
    ]

    operations = [
        migrations.RunPython(
            fix_objectives_column,
            reverse_code=reverse_fix_objectives_column
        ),
    ]





















