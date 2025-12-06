"""
Add RLS policies for director dashboard tables.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('director_dashboard', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                # Enable RLS
                "ALTER TABLE director_dashboard_cache ENABLE ROW LEVEL SECURITY;",
                "ALTER TABLE director_cohort_health ENABLE ROW LEVEL SECURITY;",
                
                # Policy for director_dashboard_cache (directors see only their own cache)
                """
                CREATE POLICY director_cache_policy ON director_dashboard_cache
                    FOR ALL
                    USING (director_id = (SELECT id FROM users WHERE id = director_id));
                """,
                
                # Policy for director_cohort_health (directors see only their own health records)
                """
                CREATE POLICY director_cohort_health_policy ON director_cohort_health
                    FOR ALL
                    USING (director_id = (SELECT id FROM users WHERE id = director_id));
                """,
            ],
            reverse_sql=[
                "DROP POLICY IF EXISTS director_cohort_health_policy ON director_cohort_health;",
                "DROP POLICY IF EXISTS director_cache_policy ON director_dashboard_cache;",
                "ALTER TABLE director_cohort_health DISABLE ROW LEVEL SECURITY;",
                "ALTER TABLE director_dashboard_cache DISABLE ROW LEVEL SECURITY;",
            ],
        ),
    ]

