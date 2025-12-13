"""
Add RLS policies for coaching tables.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('coaching', '0002_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                ("ALTER TABLE habits ENABLE ROW LEVEL SECURITY;", []),
                ("""
                CREATE POLICY habits_isolation ON habits
                FOR ALL
                USING (user_id = auth.uid());
                """, []),
            ],
            reverse_sql=[
                ("DROP POLICY IF EXISTS habits_isolation ON habits;", []),
                ("ALTER TABLE habits DISABLE ROW LEVEL SECURITY;", []),
            ],
        ),
        migrations.RunSQL(
            sql=[
                ("ALTER TABLE habitlogs ENABLE ROW LEVEL SECURITY;", []),
                ("""
                CREATE POLICY habitlogs_isolation ON habitlogs
                FOR ALL
                USING (user_id = auth.uid());
                """, []),
            ],
            reverse_sql=[
                ("DROP POLICY IF EXISTS habitlogs_isolation ON habitlogs;", []),
                ("ALTER TABLE habitlogs DISABLE ROW LEVEL SECURITY;", []),
            ],
        ),
        migrations.RunSQL(
            sql=[
                ("ALTER TABLE goals ENABLE ROW LEVEL SECURITY;", []),
                ("""
                CREATE POLICY goals_isolation ON goals
                FOR ALL
                USING (user_id = auth.uid());
                """, []),
            ],
            reverse_sql=[
                ("DROP POLICY IF EXISTS goals_isolation ON goals;", []),
                ("ALTER TABLE goals DISABLE ROW LEVEL SECURITY;", []),
            ],
        ),
        migrations.RunSQL(
            sql=[
                ("ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;", []),
                ("""
                CREATE POLICY reflections_isolation ON reflections
                FOR ALL
                USING (user_id = auth.uid());
                """, []),
            ],
            reverse_sql=[
                ("DROP POLICY IF EXISTS reflections_isolation ON reflections;", []),
                ("ALTER TABLE reflections DISABLE ROW LEVEL SECURITY;", []),
            ],
        ),
    ]

