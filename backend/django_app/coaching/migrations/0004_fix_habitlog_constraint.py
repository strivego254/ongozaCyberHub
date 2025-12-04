"""
Fix HabitLog unique constraint to use date_trunc for per-day uniqueness.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('coaching', '0003_remove_habitlog_unique_habit_per_day_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            -- Add unique constraint using date_trunc (PostgreSQL specific)
            -- This ensures only one log per habit per day
            CREATE UNIQUE INDEX IF NOT EXISTS unique_habit_per_day 
            ON habitlogs (habit_id, date_trunc('day', completed_at));
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS unique_habit_per_day;
            """
        ),
    ]

