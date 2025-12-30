# Generated manually to ensure estimated_time_minutes column exists
from django.db import migrations


def add_estimated_time_minutes_column(apps, schema_editor):
    """Add estimated_time_minutes column if it doesn't exist."""
    db_table = 'missions'
    
    with schema_editor.connection.cursor() as cursor:
        # Check if column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = %s AND column_name = 'estimated_time_minutes'
        """, [db_table])
        
        if cursor.fetchone() is None:
            # Column doesn't exist, add it
            cursor.execute("""
                ALTER TABLE missions 
                ADD COLUMN estimated_time_minutes INTEGER
            """)
            print("✅ Added 'estimated_time_minutes' column to missions table")
        else:
            print("✅ Column 'estimated_time_minutes' already exists")


def remove_estimated_time_minutes_column(apps, schema_editor):
    """Remove estimated_time_minutes column during reverse migration."""
    db_table = 'missions'
    
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(f"""
            ALTER TABLE {db_table} 
            DROP COLUMN IF EXISTS estimated_time_minutes
        """)


class Migration(migrations.Migration):

    dependencies = [
        ('missions', '0005_remove_missionartifact_mission_art_submiss_c3fba2_idx_and_more'),
    ]

    operations = [
        migrations.RunPython(
            add_estimated_time_minutes_column,
            reverse_code=remove_estimated_time_minutes_column
        ),
    ]
