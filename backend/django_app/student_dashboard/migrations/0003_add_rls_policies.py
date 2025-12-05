"""
Add Row Level Security (RLS) policies for student dashboard cache.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('student_dashboard', '0002_add_rls_policies'),
        ('users', '0001_initial'),  # Ensure users tables exist
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            -- Enable RLS on student_dashboard_cache
            ALTER TABLE student_dashboard_cache ENABLE ROW LEVEL SECURITY;
            
            -- Policy: Students can only see their own dashboard
            CREATE POLICY student_dashboard_policy ON student_dashboard_cache
                FOR ALL
                USING (user_id = current_setting('app.current_user_id', true)::bigint);
            
            -- Policy: Admins can see all dashboards
            CREATE POLICY admin_dashboard_policy ON student_dashboard_cache
                FOR ALL
                USING (
                    EXISTS (
                        SELECT 1 FROM users u
                        JOIN user_roles ur ON u.id = ur.user_id
                        JOIN roles r ON ur.role_id = r.id
                        WHERE u.id = current_setting('app.current_user_id', true)::bigint
                        AND r.name = 'admin'
                        AND ur.is_active = true
                    )
                );
            """,
            reverse_sql="""
            DROP POLICY IF EXISTS student_dashboard_policy ON student_dashboard_cache;
            DROP POLICY IF EXISTS admin_dashboard_policy ON student_dashboard_cache;
            ALTER TABLE student_dashboard_cache DISABLE ROW LEVEL SECURITY;
            """
        ),
    ]

