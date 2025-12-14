"""
Add RLS policies for coaching tables.
Note: RLS policies are disabled by default as they require auth.uid() from PostgREST.
Enable them manually if you have PostgREST installed and configured.
"""
from django.db import migrations


def create_rls_policies(apps, schema_editor):
    """Create RLS policies if auth schema exists."""
    with schema_editor.connection.cursor() as cursor:
        # Check if auth schema exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.schemata 
                WHERE schema_name = 'auth'
            );
        """)
        auth_schema_exists = cursor.fetchone()[0]
        
        if not auth_schema_exists:
            # Skip RLS setup if auth schema doesn't exist
            # RLS will be handled at application level
            return
        
        # Create RLS policies using auth.uid()
        policies = [
            ("habits", "habits_isolation"),
            ("habitlogs", "habitlogs_isolation"),
            ("goals", "goals_isolation"),
            ("reflections", "reflections_isolation"),
        ]
        
        for table, policy_name in policies:
            try:
                cursor.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
                cursor.execute(f"""
                    CREATE POLICY {policy_name} ON {table}
                    FOR ALL
                    USING (user_id = auth.uid());
                """)
            except Exception:
                # Policy might already exist, skip
                pass


def reverse_rls_policies(apps, schema_editor):
    """Remove RLS policies."""
    with schema_editor.connection.cursor() as cursor:
        policies = [
            ("habits", "habits_isolation"),
            ("habitlogs", "habitlogs_isolation"),
            ("goals", "goals_isolation"),
            ("reflections", "reflections_isolation"),
        ]
        
        for table, policy_name in policies:
            try:
                cursor.execute(f"DROP POLICY IF EXISTS {policy_name} ON {table};")
                cursor.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
            except Exception:
                pass


class Migration(migrations.Migration):

    dependencies = [
        ('coaching', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            create_rls_policies,
            reverse_rls_policies,
        ),
    ]

