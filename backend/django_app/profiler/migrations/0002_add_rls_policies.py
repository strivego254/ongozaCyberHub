"""
Add Row Level Security (RLS) policies for profiler tables.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('profiler', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            -- Enable RLS on profiler tables
            ALTER TABLE profilersessions ENABLE ROW LEVEL SECURITY;
            ALTER TABLE profileranswers ENABLE ROW LEVEL SECURITY;
            
            -- Policy: Users can only see their own profiler sessions
            CREATE POLICY student_profiler_sessions ON profilersessions
                FOR ALL
                USING (user_id = current_setting('app.current_user_id', true)::uuid);
            
            CREATE POLICY student_profiler_answers ON profileranswers
                FOR ALL
                USING (
                    session_id IN (
                        SELECT id FROM profilersessions
                        WHERE user_id = current_setting('app.current_user_id', true)::uuid
                    )
                );
            """,
            reverse_sql="""
            DROP POLICY IF EXISTS student_profiler_sessions ON profilersessions;
            DROP POLICY IF EXISTS student_profiler_answers ON profileranswers;
            ALTER TABLE profilersessions DISABLE ROW LEVEL SECURITY;
            ALTER TABLE profileranswers DISABLE ROW LEVEL SECURITY;
            """
        ),
    ]

