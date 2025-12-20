# Generated manually to add created_at and updated_at columns to subscription_plans table

from django.db import migrations


def add_timestamp_columns(apps, schema_editor):
    """Add created_at and updated_at columns if they don't exist."""
    schema_editor.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'subscription_plans' 
                AND column_name = 'created_at'
            ) THEN
                ALTER TABLE subscription_plans 
                ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
            END IF;
            
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'subscription_plans' 
                AND column_name = 'updated_at'
            ) THEN
                ALTER TABLE subscription_plans 
                ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
            END IF;
        END $$;
    """)


def reverse_migration(apps, schema_editor):
    """Remove the columns if rolling back."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0002_add_missing_fields'),
    ]

    operations = [
        migrations.RunPython(add_timestamp_columns, reverse_migration),
    ]
<<<<<<< HEAD
=======
















>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
