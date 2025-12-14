# Generated manually to add missing categories field
# This migration safely adds the categories field if it doesn't exist

from django.db import migrations, models


def add_categories_field_if_missing(apps, schema_editor):
    """Add categories field if it doesn't exist in the database."""
    db_table = 'programs'
    
    # Check if column exists
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name=%s AND column_name='categories'
        """, [db_table])
        
        column_exists = cursor.fetchone() is not None
        
        if not column_exists:
            # Add the column manually using raw SQL
            # Using JSONB for PostgreSQL (adjust if using different database)
            cursor.execute("""
                ALTER TABLE programs 
                ADD COLUMN categories JSONB DEFAULT '[]'::jsonb
            """)
            print(f"Added 'categories' column to '{db_table}' table")
        else:
            print(f"Column 'categories' already exists in '{db_table}' table")


def remove_categories_field_if_exists(apps, schema_editor):
    """Remove categories field during reverse migration."""
    db_table = 'programs'
    
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name=%s AND column_name='categories'
        """, [db_table])
        
        column_exists = cursor.fetchone() is not None
        
        if column_exists:
            cursor.execute("ALTER TABLE programs DROP COLUMN categories")
            print(f"Removed 'categories' column from '{db_table}' table")


class Migration(migrations.Migration):

    dependencies = [
        ('programs', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            add_categories_field_if_missing,
            reverse_code=remove_categories_field_if_exists,
        ),
    ]

