"""
Add Row Level Security (RLS) policies for coaching tables.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('coaching', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            -- Enable RLS on coaching tables
            ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
            ALTER TABLE habitlogs ENABLE ROW LEVEL SECURITY;
            ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
            ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
            
            -- Policies: Users can only see their own data
            CREATE POLICY student_habits ON habits
                FOR ALL USING (user_id = current_setting('app.current_user_id', true)::bigint);
            
            CREATE POLICY student_habitlogs ON habitlogs
                FOR ALL USING (user_id = current_setting('app.current_user_id', true)::bigint);
            
            CREATE POLICY student_goals ON goals
                FOR ALL USING (user_id = current_setting('app.current_user_id', true)::bigint);
            
            CREATE POLICY student_reflections ON reflections
                FOR ALL USING (user_id = current_setting('app.current_user_id', true)::bigint);
            """,
            reverse_sql="""
            DROP POLICY IF EXISTS student_habits ON habits;
            DROP POLICY IF EXISTS student_habitlogs ON habitlogs;
            DROP POLICY IF EXISTS student_goals ON goals;
            DROP POLICY IF EXISTS student_reflections ON reflections;
            ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
            ALTER TABLE habitlogs DISABLE ROW LEVEL SECURITY;
            ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
            ALTER TABLE reflections DISABLE ROW LEVEL SECURITY;
            """
        ),
    ]

