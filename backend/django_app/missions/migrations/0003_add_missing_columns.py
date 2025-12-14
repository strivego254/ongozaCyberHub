# Generated manually to add missing columns to missions table
# Adds: type, track_key, estimated_time_minutes, requirements

from django.db import migrations, models
import django.core.validators


def add_missing_columns(apps, schema_editor):
    """Add missing columns to missions table if they don't exist."""
    db_table = 'missions'
    
    with schema_editor.connection.cursor() as cursor:
        # Check and add 'type' column
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name=%s AND column_name='type'
        """, [db_table])
        if cursor.fetchone() is None:
            cursor.execute("""
                ALTER TABLE missions 
                ADD COLUMN type VARCHAR(20) DEFAULT 'lab'
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS missions_type_idx ON missions(type)
            """)
            print("✅ Added 'type' column")
        
        # Check and add 'track_key' column
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name=%s AND column_name='track_key'
        """, [db_table])
        if cursor.fetchone() is None:
            cursor.execute("""
                ALTER TABLE missions 
                ADD COLUMN track_key VARCHAR(50)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS missions_track_key_idx ON missions(track_key)
            """)
            print("✅ Added 'track_key' column")
        
        # Check and add 'estimated_time_minutes' column
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name=%s AND column_name='estimated_time_minutes'
        """, [db_table])
        if cursor.fetchone() is None:
            cursor.execute("""
                ALTER TABLE missions 
                ADD COLUMN estimated_time_minutes INTEGER
            """)
            print("✅ Added 'estimated_time_minutes' column")
        
        # Check and add 'requirements' column
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name=%s AND column_name='requirements'
        """, [db_table])
        if cursor.fetchone() is None:
            cursor.execute("""
                ALTER TABLE missions 
                ADD COLUMN requirements JSONB DEFAULT '{}'::jsonb
            """)
            print("✅ Added 'requirements' column")


def remove_columns(apps, schema_editor):
    """Remove columns during reverse migration."""
    db_table = 'missions'
    
    with schema_editor.connection.cursor() as cursor:
        for column in ['type', 'track_key', 'estimated_time_minutes', 'requirements']:
            cursor.execute(f"""
                ALTER TABLE {db_table} 
                DROP COLUMN IF EXISTS {column}
            """)


class Migration(migrations.Migration):

    dependencies = [
        ('missions', '0002_add_code_column_if_missing'),
    ]

    operations = [
        migrations.RunPython(
            add_missing_columns,
            reverse_code=remove_columns
        ),
    ]

