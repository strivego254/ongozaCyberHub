"""
Add Row Level Security policies for mentorship coordination tables.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('mentorship_coordination', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            -- Enable RLS
            ALTER TABLE menteementorassignments ENABLE ROW LEVEL SECURITY;
            ALTER TABLE mentorsessions ENABLE ROW LEVEL SECURITY;
            ALTER TABLE mentorworkqueue ENABLE ROW LEVEL SECURITY;
            ALTER TABLE mentorflags ENABLE ROW LEVEL SECURITY;
            
            -- Policies for assignments (mentors see their assignments, mentees see their assignments)
            CREATE POLICY mentor_assignments_policy ON menteementorassignments
                FOR ALL USING (
                    mentor_id = current_setting('app.current_user_id', true)::uuid
                    OR mentee_id = current_setting('app.current_user_id', true)::uuid
                );
            
            -- Policies for sessions
            CREATE POLICY mentor_sessions_policy ON mentorsessions
                FOR ALL USING (
                    mentor_id = current_setting('app.current_user_id', true)::uuid
                    OR mentee_id = current_setting('app.current_user_id', true)::uuid
                );
            
            -- Policies for work queue (mentors see their queue)
            CREATE POLICY mentor_workqueue_policy ON mentorworkqueue
                FOR ALL USING (
                    mentor_id = current_setting('app.current_user_id', true)::uuid
                );
            
            -- Policies for flags (mentors see flags they raised, mentees see their flags)
            CREATE POLICY mentor_flags_policy ON mentorflags
                FOR ALL USING (
                    mentor_id = current_setting('app.current_user_id', true)::uuid
                    OR mentee_id = current_setting('app.current_user_id', true)::uuid
                );
            """,
            reverse_sql="""
            DROP POLICY IF EXISTS mentor_assignments_policy ON menteementorassignments;
            DROP POLICY IF EXISTS mentor_sessions_policy ON mentorsessions;
            DROP POLICY IF EXISTS mentor_workqueue_policy ON mentorworkqueue;
            DROP POLICY IF EXISTS mentor_flags_policy ON mentorflags;
            
            ALTER TABLE menteementorassignments DISABLE ROW LEVEL SECURITY;
            ALTER TABLE mentorsessions DISABLE ROW LEVEL SECURITY;
            ALTER TABLE mentorworkqueue DISABLE ROW LEVEL SECURITY;
            ALTER TABLE mentorflags DISABLE ROW LEVEL SECURITY;
            """
        ),
    ]

