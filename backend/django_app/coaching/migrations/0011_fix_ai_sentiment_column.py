"""
Fix ai_sentiment column issue - rename if exists, otherwise skip.
"""
from django.db import migrations


def fix_ai_sentiment_column(apps, schema_editor):
    """Rename ai_sentiment to sentiment if it exists, otherwise skip."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Check if ai_sentiment column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'coaching_reflections' 
            AND column_name = 'ai_sentiment'
            AND table_schema = 'public'
        """)
        
        if cursor.fetchone():
            # Check if sentiment column already exists
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'coaching_reflections' 
                AND column_name = 'sentiment'
                AND table_schema = 'public'
            """)
            
            if not cursor.fetchone():
                # Rename ai_sentiment to sentiment
                cursor.execute("""
                    ALTER TABLE coaching_reflections 
                    RENAME COLUMN ai_sentiment TO sentiment
                """)
            else:
                # Both columns exist - copy data and drop ai_sentiment
                cursor.execute("""
                    UPDATE coaching_reflections 
                    SET sentiment = ai_sentiment 
                    WHERE sentiment IS NULL AND ai_sentiment IS NOT NULL
                """)
                cursor.execute("""
                    ALTER TABLE coaching_reflections 
                    DROP COLUMN ai_sentiment
                """)


def reverse_fix_ai_sentiment_column(apps, schema_editor):
    """Reverse migration - not needed, but required for RunPython."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('coaching', '0010_remove_reflection_ai_sentiment_and_more'),
    ]

    operations = [
        migrations.RunPython(
            fix_ai_sentiment_column,
            reverse_fix_ai_sentiment_column
        ),
    ]






