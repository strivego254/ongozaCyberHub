"""
Add Row Level Security (RLS) policies for missions tables.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('missions', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            -- Enable RLS on missions tables
            ALTER TABLE missionsubmissions ENABLE ROW LEVEL SECURITY;
            ALTER TABLE missionfiles ENABLE ROW LEVEL SECURITY;
            
            -- Policies: Users can only see their own submissions
            CREATE POLICY student_mission_submissions ON missionsubmissions
                FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid);
            
            CREATE POLICY student_mission_files ON missionfiles
                FOR ALL USING (
                    submission_id IN (
                        SELECT id FROM missionsubmissions
                        WHERE user_id = current_setting('app.current_user_id', true)::uuid
                    )
                );
            """,
            reverse_sql="""
            DROP POLICY IF EXISTS student_mission_submissions ON missionsubmissions;
            DROP POLICY IF EXISTS student_mission_files ON missionfiles;
            ALTER TABLE missionsubmissions DISABLE ROW LEVEL SECURITY;
            ALTER TABLE missionfiles DISABLE ROW LEVEL SECURITY;
            """
        ),
    ]

