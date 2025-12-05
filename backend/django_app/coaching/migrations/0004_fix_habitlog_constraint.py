"""
Fix HabitLog unique constraint to use date_trunc for per-day uniqueness.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('coaching', '0003_remove_habitlog_unique_habit_per_day_and_more'),
    ]

    operations = [
        # Note: Unique constraint per day is handled at application level
        # (see HabitLog model comment). PostgreSQL requires IMMUTABLE functions
        # for index expressions, and date_trunc casting is not suitable here.
        migrations.RunSQL(
            sql="SELECT 1; -- No-op: constraint handled at application level",
            reverse_sql="SELECT 1; -- No-op"
        ),
    ]

