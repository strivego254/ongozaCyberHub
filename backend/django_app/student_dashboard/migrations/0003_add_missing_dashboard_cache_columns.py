"""
Repair migration: add missing columns to student_dashboard_cache if the table exists but
was created without all fields (e.g. due to faked/partial migrations).

Fixes runtime 500s like:
  django.db.utils.ProgrammingError: column student_dashboard_cache.future_you_persona does not exist
"""

from django.db import migrations


def add_missing_columns(apps, schema_editor):
    db_table = "student_dashboard_cache"

    with schema_editor.connection.cursor() as cursor:
        def has_column(column_name: str) -> bool:
            cursor.execute(
                """
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = %s AND column_name = %s
                """,
                [db_table, column_name],
            )
            return cursor.fetchone() is not None

        # Future-You & Identity (Profiler)
        if not has_column("future_you_persona"):
            cursor.execute(
                """
                ALTER TABLE student_dashboard_cache
                ADD COLUMN future_you_persona VARCHAR(255) NOT NULL DEFAULT ''
                """
            )
            print("✅ Added student_dashboard_cache.future_you_persona")

        if not has_column("recommended_track"):
            cursor.execute(
                """
                ALTER TABLE student_dashboard_cache
                ADD COLUMN recommended_track VARCHAR(255) NOT NULL DEFAULT ''
                """
            )
            print("✅ Added student_dashboard_cache.recommended_track")

        if not has_column("identity_alignment_pct"):
            cursor.execute(
                """
                ALTER TABLE student_dashboard_cache
                ADD COLUMN identity_alignment_pct NUMERIC(5, 2) NULL
                """
            )
            print("✅ Added student_dashboard_cache.identity_alignment_pct")

        if not has_column("estimated_readiness_window"):
            cursor.execute(
                """
                ALTER TABLE student_dashboard_cache
                ADD COLUMN estimated_readiness_window VARCHAR(50) NOT NULL DEFAULT ''
                """
            )
            print("✅ Added student_dashboard_cache.estimated_readiness_window")

        # Coaching OS Extended
        if not has_column("reflections_last_7d"):
            cursor.execute(
                """
                ALTER TABLE student_dashboard_cache
                ADD COLUMN reflections_last_7d INTEGER NOT NULL DEFAULT 0
                """
            )
            print("✅ Added student_dashboard_cache.reflections_last_7d")

        if not has_column("goals_completed_pct"):
            cursor.execute(
                """
                ALTER TABLE student_dashboard_cache
                ADD COLUMN goals_completed_pct NUMERIC(5, 2) NOT NULL DEFAULT 0
                """
            )
            print("✅ Added student_dashboard_cache.goals_completed_pct")

        # AI Recommendations
        if not has_column("top_recommendation"):
            cursor.execute(
                """
                ALTER TABLE student_dashboard_cache
                ADD COLUMN top_recommendation JSONB NOT NULL DEFAULT '{}'::jsonb
                """
            )
            print("✅ Added student_dashboard_cache.top_recommendation")

        if not has_column("urgent_nudges"):
            cursor.execute(
                """
                ALTER TABLE student_dashboard_cache
                ADD COLUMN urgent_nudges JSONB NOT NULL DEFAULT '[]'::jsonb
                """
            )
            print("✅ Added student_dashboard_cache.urgent_nudges")

        # Subscription Extended
        if not has_column("subscription_tier"):
            cursor.execute(
                """
                ALTER TABLE student_dashboard_cache
                ADD COLUMN subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free'
                """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS student_dashboard_cache_subscription_tier_idx 
                ON student_dashboard_cache(subscription_tier)
                """
            )
            print("✅ Added student_dashboard_cache.subscription_tier")

        if not has_column("enhanced_access_days_left"):
            cursor.execute(
                """
                ALTER TABLE student_dashboard_cache
                ADD COLUMN enhanced_access_days_left INTEGER NULL
                """
            )
            print("✅ Added student_dashboard_cache.enhanced_access_days_left")

        if not has_column("next_billing_date"):
            cursor.execute(
                """
                ALTER TABLE student_dashboard_cache
                ADD COLUMN next_billing_date DATE NULL
                """
            )
            print("✅ Added student_dashboard_cache.next_billing_date")


def noop_reverse(apps, schema_editor):
    # Keep reverse as a no-op; this is a repair migration for dev/prod drift.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("student_dashboard", "0002_create_missing_tables_if_faked"),
    ]

    operations = [
        migrations.RunPython(add_missing_columns, reverse_code=noop_reverse),
    ]







