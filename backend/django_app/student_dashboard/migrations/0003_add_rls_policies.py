"""
Add RLS policies for student dashboard tables.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('student_dashboard', '0002_initial'),
    ]

    operations = [
        migrations.RunSQL(
            # Enable RLS on student_dashboard_cache
            """
            ALTER TABLE student_dashboard_cache ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY student_cache_policy ON student_dashboard_cache
                FOR ALL
                USING (user_id = auth.uid());
            """,
            reverse_sql="""
            DROP POLICY IF EXISTS student_cache_policy ON student_dashboard_cache;
            ALTER TABLE student_dashboard_cache DISABLE ROW LEVEL SECURITY;
            """
        ),
        migrations.RunSQL(
            # Enable RLS on student_mission_progress
            """
            ALTER TABLE student_mission_progress ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY student_mission_policy ON student_mission_progress
                FOR ALL
                USING (user_id = auth.uid());
            """,
            reverse_sql="""
            DROP POLICY IF EXISTS student_mission_policy ON student_mission_progress;
            ALTER TABLE student_mission_progress DISABLE ROW LEVEL SECURITY;
            """
        ),
    ]

