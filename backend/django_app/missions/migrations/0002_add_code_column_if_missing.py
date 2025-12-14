# Generated manually to add missing code field if it doesn't exist
# This migration safely adds the code field if it's missing from the database

from django.db import migrations, models


def add_code_field_if_missing(apps, schema_editor):
    """Add code field if it doesn't exist in the database."""
    db_table = 'missions'
    
    # Check if column exists
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name=%s AND column_name='code'
        """, [db_table])
        
        column_exists = cursor.fetchone() is not None
        
        if not column_exists:
            # Add the column manually using raw SQL
            cursor.execute("""
                ALTER TABLE missions 
                ADD COLUMN code VARCHAR(50) UNIQUE
            """)
            
            # Create index
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS missions_code_idx ON missions(code)
            """)
            
            print(f"✅ Added 'code' column to '{db_table}' table")
        else:
            print(f"✅ Column 'code' already exists in '{db_table}' table")


def remove_code_field_if_exists(apps, schema_editor):
    """Remove code field during reverse migration."""
    db_table = 'missions'
    
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name=%s AND column_name='code'
        """, [db_table])
        
        column_exists = cursor.fetchone() is not None
        
        if column_exists:
            cursor.execute("""
                ALTER TABLE missions 
                DROP COLUMN IF EXISTS code
            """)
            print(f"✅ Removed 'code' column from '{db_table}' table")


class Migration(migrations.Migration):

    dependencies = [
        ('missions', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            add_code_field_if_missing,
            reverse_code=remove_code_field_if_exists
        ),
    ]
