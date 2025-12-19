# Generated manually to add all missing fields to subscription_plans table
# Uses RunSQL to conditionally add columns only if they don't exist

from django.db import migrations


def add_missing_columns(apps, schema_editor):
    """Add missing columns only if they don't exist."""
    db_alias = schema_editor.connection.alias
    
    # List of columns to add with their SQL definitions
    columns_to_add = [
        ("ai_coach_daily_limit", "INTEGER NULL"),
        ("portfolio_item_limit", "INTEGER NULL"),
        ("missions_access_type", "VARCHAR(50) DEFAULT 'none'"),
        ("mentorship_access", "BOOLEAN DEFAULT FALSE"),
        ("talentscope_access", "VARCHAR(50) DEFAULT 'none'"),
        ("marketplace_contact", "BOOLEAN DEFAULT FALSE"),
        ("enhanced_access_days", "INTEGER NULL"),
        ("features", "JSONB DEFAULT '[]'::jsonb"),
    ]
    
    for column_name, column_def in columns_to_add:
        schema_editor.execute(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'subscription_plans' 
                    AND column_name = '{column_name}'
                ) THEN
                    ALTER TABLE subscription_plans 
                    ADD COLUMN {column_name} {column_def};
                END IF;
            END $$;
        """)


def reverse_migration(apps, schema_editor):
    """Remove the columns if rolling back."""
    # In production, you might want to keep data, so this is a no-op
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(add_missing_columns, reverse_migration),
    ]
