# Generated manually to fix all legacy columns with NOT NULL constraints
# This makes all columns that aren't in the Django model nullable
from django.db import migrations


def fix_all_legacy_columns(apps, schema_editor):
    """Make all legacy columns nullable that aren't in the Django model."""
    db_table = 'missions'
    
    # Columns that exist in DB but not in Django model (legacy columns)
    legacy_columns = [
        'story',
        'objectives',
        'subtasks',
        'instructions',
        'resources',
        'expected_outcomes',
        'prerequisites',
        'learning_objectives',
    ]
    
    with schema_editor.connection.cursor() as cursor:
        # First, get all columns that actually exist in the table
        cursor.execute("""
            SELECT column_name, is_nullable, data_type
            FROM information_schema.columns 
            WHERE table_name = %s
            ORDER BY column_name
        """, [db_table])
        
        existing_columns = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Django model fields (from models.py)
        django_model_fields = {
            'id', 'code', 'title', 'description', 'difficulty', 'type',
            'track_id', 'track_key', 'est_hours', 'estimated_time_minutes',
            'competencies', 'requirements', 'created_at'
        }
        
        # Find columns that exist in DB but not in Django model
        legacy_cols_to_fix = [col for col in existing_columns.keys() 
                              if col not in django_model_fields 
                              and existing_columns.get(col) == 'NO']
        
        print(f"Found {len(legacy_cols_to_fix)} legacy columns to make nullable: {legacy_cols_to_fix}")
        
        for column in legacy_cols_to_fix:
            try:
                cursor.execute(f"""
                    ALTER TABLE {db_table} 
                    ALTER COLUMN {column} DROP NOT NULL
                """)
                print(f"✅ Made '{column}' column nullable in {db_table} table")
            except Exception as e:
                print(f"⚠️ Failed to make '{column}' nullable: {e}")


def reverse_fix_all_legacy_columns(apps, schema_editor):
    """Reverse migration - not really needed, but included for completeness."""
    # We don't want to reverse this as these columns should remain nullable
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('missions', '0008_fix_objectives_column_constraint'),
    ]

    operations = [
        migrations.RunPython(
            fix_all_legacy_columns,
            reverse_code=reverse_fix_all_legacy_columns
        ),
    ]




