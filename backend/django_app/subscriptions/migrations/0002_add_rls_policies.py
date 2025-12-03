"""
Add Row Level Security (RLS) policies for subscriptions tables.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            -- Enable RLS on subscriptions tables
            ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
            
            -- Policy: Users can only see their own subscription
            CREATE POLICY student_subscriptions ON user_subscriptions
                FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid);
            """,
            reverse_sql="""
            DROP POLICY IF EXISTS student_subscriptions ON user_subscriptions;
            ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
            """
        ),
    ]

