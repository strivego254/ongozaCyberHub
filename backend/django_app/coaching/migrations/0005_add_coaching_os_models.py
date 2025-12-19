# Generated migration for Coaching OS full schema
import django.core.validators
import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models


def rename_category_to_type_if_exists(apps, schema_editor):
    """Conditionally rename category to type if category column exists."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Check which table name exists (could be 'habits' or 'coaching_habits')
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('habits', 'coaching_habits')
            AND table_schema = 'public'
        """)
        table_result = cursor.fetchone()
        if not table_result:
            # Table doesn't exist yet, skip
            return
        
        table_name = table_result[0]
        
        # Check if category column exists
        cursor.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}' 
            AND column_name = 'category'
        """)
        category_exists = cursor.fetchone() is not None
        
        # Check if type column already exists
        cursor.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}' 
            AND column_name = 'type'
        """)
        type_exists = cursor.fetchone() is not None
        
        if category_exists and not type_exists:
            # Rename category to type
            cursor.execute(f"ALTER TABLE {table_name} RENAME COLUMN category TO type")
        elif not category_exists and not type_exists:
            # Add type column if neither exists
            cursor.execute(f"""
                ALTER TABLE {table_name} 
                ADD COLUMN type VARCHAR(20) DEFAULT 'custom'
            """)


def reverse_rename_type_to_category(apps, schema_editor):
    """Reverse: rename type back to category if type exists."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Check which table name exists
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('habits', 'coaching_habits')
            AND table_schema = 'public'
        """)
        table_result = cursor.fetchone()
        if not table_result:
            return
        
        table_name = table_result[0]
        
        cursor.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}' 
            AND column_name = 'type'
        """)
        if cursor.fetchone() is not None:
            cursor.execute(f"ALTER TABLE {table_name} RENAME COLUMN type TO category")


def rename_habit_fields_conditionally(apps, schema_editor):
    """Conditionally rename all Habit model fields if they exist."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Check which table name exists
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('habits', 'coaching_habits')
            AND table_schema = 'public'
        """)
        table_result = cursor.fetchone()
        if not table_result:
            return
        
        table_name = table_result[0]
        
        # Define field renames: (old_name, new_name)
        field_renames = [
            ('streak_current', 'streak'),
            ('streak_longest', 'longest_streak'),
            ('target_frequency', 'frequency'),
        ]
        
        for old_name, new_name in field_renames:
            # Check if old column exists
            cursor.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' 
                AND column_name = '{old_name}'
            """)
            old_exists = cursor.fetchone() is not None
            
            # Check if new column already exists
            cursor.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' 
                AND column_name = '{new_name}'
            """)
            new_exists = cursor.fetchone() is not None
            
            if old_exists and not new_exists:
                # Rename the column
                cursor.execute(f"ALTER TABLE {table_name} RENAME COLUMN {old_name} TO {new_name}")
            elif not old_exists and not new_exists:
                # Neither exists - might need to add it, but we'll skip for now
                # The AddField operations will handle adding missing fields
                pass


def reverse_rename_habit_fields(apps, schema_editor):
    """Reverse: rename fields back to original names."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('habits', 'coaching_habits')
            AND table_schema = 'public'
        """)
        table_result = cursor.fetchone()
        if not table_result:
            return
        
        table_name = table_result[0]
        
        # Reverse field renames: (new_name, old_name)
        field_renames = [
            ('streak', 'streak_current'),
            ('longest_streak', 'streak_longest'),
            ('frequency', 'target_frequency'),
        ]
        
        for new_name, old_name in field_renames:
            cursor.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' 
                AND column_name = '{new_name}'
            """)
            if cursor.fetchone() is not None:
                cursor.execute(f"ALTER TABLE {table_name} RENAME COLUMN {new_name} TO {old_name}")


def rename_habitlog_fields_conditionally(apps, schema_editor):
    """Conditionally rename HabitLog fields if they exist."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Check which table name exists
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('habitlogs', 'coaching_habit_logs')
            AND table_schema = 'public'
        """)
        table_result = cursor.fetchone()
        if not table_result:
            return
        
        table_name = table_result[0]
        
        # Rename completed_at to logged_at
        cursor.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}' 
            AND column_name = 'completed_at'
        """)
        old_exists = cursor.fetchone() is not None
        
        cursor.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}' 
            AND column_name = 'logged_at'
        """)
        new_exists = cursor.fetchone() is not None
        
        if old_exists and not new_exists:
            cursor.execute(f"ALTER TABLE {table_name} RENAME COLUMN completed_at TO logged_at")


def reverse_rename_habitlog_fields(apps, schema_editor):
    """Reverse: rename logged_at back to completed_at."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('habitlogs', 'coaching_habit_logs')
            AND table_schema = 'public'
        """)
        table_result = cursor.fetchone()
        if not table_result:
            return
        
        table_name = table_result[0]
        
        cursor.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}' 
            AND column_name = 'logged_at'
        """)
        if cursor.fetchone() is not None:
            cursor.execute(f"ALTER TABLE {table_name} RENAME COLUMN logged_at TO completed_at")


def rename_reflection_fields_conditionally(apps, schema_editor):
    """Conditionally rename Reflection fields if they exist."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Check which table name exists
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('reflections', 'coaching_reflections')
            AND table_schema = 'public'
        """)
        table_result = cursor.fetchone()
        if not table_result:
            return
        
        table_name = table_result[0]
        
        # Handle response field: if content already exists (from prompt rename), remove response
        # Otherwise, rename response to content
        cursor.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}' 
            AND column_name = 'response'
        """)
        response_exists = cursor.fetchone() is not None
        
        cursor.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}' 
            AND column_name = 'content'
        """)
        content_exists = cursor.fetchone() is not None
        
        if response_exists:
            if content_exists:
                # Content already exists from prompt rename, so remove response
                cursor.execute(f"ALTER TABLE {table_name} DROP COLUMN response")
            else:
                # Content doesn't exist, rename response to content
                cursor.execute(f"ALTER TABLE {table_name} RENAME COLUMN response TO content")
        
        # Define other field renames: (old_name, new_name)
        field_renames = [
            ('sentiment_score', 'sentiment'),
            ('behavior_tags', 'emotion_tags'),
        ]
        
        for old_name, new_name in field_renames:
            cursor.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' 
                AND column_name = '{old_name}'
            """)
            old_exists = cursor.fetchone() is not None
            
            cursor.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' 
                AND column_name = '{new_name}'
            """)
            new_exists = cursor.fetchone() is not None
            
            if old_exists and not new_exists:
                cursor.execute(f"ALTER TABLE {table_name} RENAME COLUMN {old_name} TO {new_name}")


def reverse_rename_reflection_fields(apps, schema_editor):
    """Reverse: rename Reflection fields back."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('reflections', 'coaching_reflections')
            AND table_schema = 'public'
        """)
        table_result = cursor.fetchone()
        if not table_result:
            return
        
        table_name = table_result[0]
        
        # Reverse field renames: (new_name, old_name)
        field_renames = [
            ('content', 'response'),
            ('sentiment', 'sentiment_score'),
            ('emotion_tags', 'behavior_tags'),
        ]
        
        for new_name, old_name in field_renames:
            cursor.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' 
                AND column_name = '{new_name}'
            """)
            if cursor.fetchone() is not None:
                cursor.execute(f"ALTER TABLE {table_name} RENAME COLUMN {new_name} TO {old_name}")


def add_fields_conditionally(apps, schema_editor):
    """Conditionally add fields only if they don't exist."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Define fields to add: (table_name_options, field_name, sql_type, default_value)
        fields_to_add = [
            # Habit fields
            (['habits', 'coaching_habits'], 'is_active', 'BOOLEAN', "DEFAULT TRUE"),
            (['habits', 'coaching_habits'], 'updated_at', 'TIMESTAMP WITH TIME ZONE', "DEFAULT CURRENT_TIMESTAMP"),
            
            # HabitLog fields
            (['habitlogs', 'coaching_habit_logs'], 'date', 'DATE', "DEFAULT CURRENT_DATE"),
            (['habitlogs', 'coaching_habit_logs'], 'status', 'VARCHAR(20)', "DEFAULT 'completed'"),
            
            # Goal fields
            (['goals', 'coaching_goals'], 'progress', 'INTEGER', "DEFAULT 0"),
            (['goals', 'coaching_goals'], 'target', 'INTEGER', "DEFAULT 1"),
            (['goals', 'coaching_goals'], 'current', 'INTEGER', "DEFAULT 0"),
            (['goals', 'coaching_goals'], 'subscription_tier', 'VARCHAR(20)', "NULL"),
            (['goals', 'coaching_goals'], 'due_date', 'DATE', "NULL"),
            (['goals', 'coaching_goals'], 'updated_at', 'TIMESTAMP WITH TIME ZONE', "DEFAULT CURRENT_TIMESTAMP"),
            
            # Reflection fields
            (['reflections', 'coaching_reflections'], 'date', 'DATE', "DEFAULT CURRENT_DATE"),
            (['reflections', 'coaching_reflections'], 'ai_insights', 'TEXT', "NULL"),
            (['reflections', 'coaching_reflections'], 'word_count', 'INTEGER', "DEFAULT 0"),
            (['reflections', 'coaching_reflections'], 'updated_at', 'TIMESTAMP WITH TIME ZONE', "DEFAULT CURRENT_TIMESTAMP"),
        ]
        
        for table_options, field_name, sql_type, default_value in fields_to_add:
            # Find which table exists
            table_name = None
            for table_option in table_options:
                cursor.execute(f"""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_name = '{table_option}'
                    AND table_schema = 'public'
                """)
                if cursor.fetchone():
                    table_name = table_option
                    break
            
            if not table_name:
                continue  # Table doesn't exist, skip
            
            # Check if column already exists
            cursor.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' 
                AND column_name = '{field_name}'
            """)
            if cursor.fetchone():
                continue  # Column already exists, skip
            
            # Add the column
            cursor.execute(f"""
                ALTER TABLE {table_name} 
                ADD COLUMN {field_name} {sql_type} {default_value}
            """)


def reverse_add_fields(apps, schema_editor):
    """Reverse: remove added fields (optional, can be no-op for safety)."""
    # For safety, we won't remove columns in reverse
    pass


def remove_prompt_field_if_exists(apps, schema_editor):
    """Conditionally remove prompt field from Reflection if it exists."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Find which table exists
        table_name = None
        for table_option in ['reflections', 'coaching_reflections']:
            cursor.execute(f"""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = '{table_option}'
                AND table_schema = 'public'
            """)
            if cursor.fetchone():
                table_name = table_option
                break
        
        if not table_name:
            return  # Table doesn't exist, skip
        
        # Check if column exists
        cursor.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}' 
            AND column_name = 'prompt'
        """)
        if cursor.fetchone():
            # Column exists, remove it
            cursor.execute(f"ALTER TABLE {table_name} DROP COLUMN prompt")


def reverse_remove_prompt_field(apps, schema_editor):
    """Reverse: add prompt field back (optional, can be no-op)."""
    pass


def add_indexes_conditionally(apps, schema_editor):
    """Conditionally add indexes only if all required fields exist."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Define indexes: (table_options, index_name, fields_list)
        indexes_to_add = [
            # Habit indexes
            (['habits', 'coaching_habits'], 'coaching_ha_user_id_active_idx', ['user_id', 'is_active']),
            (['habits', 'coaching_habits'], 'coaching_ha_user_id_type_idx', ['user_id', 'type']),
            
            # HabitLog indexes
            (['habitlogs', 'coaching_habit_logs'], 'coaching_hl_user_date_status_idx', ['user_id', 'date', 'status']),
            
            # Reflection indexes
            (['reflections', 'coaching_reflections'], 'coaching_re_sentiment_idx', ['sentiment']),
            
            # AICoachSession indexes
            (['ai_coach_sessions'], 'coaching_ai_user_session_type_idx', ['user_id', 'session_type']),
            
            # AICoachMessage indexes
            (['ai_coach_messages'], 'coaching_ai_session_created_idx', ['session_id', 'created_at']),
        ]
        
        for table_options, index_name, fields in indexes_to_add:
            # Find which table exists
            table_name = None
            for table_option in table_options:
                cursor.execute(f"""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_name = '{table_option}'
                    AND table_schema = 'public'
                """)
                if cursor.fetchone():
                    table_name = table_option
                    break
            
            if not table_name:
                continue  # Table doesn't exist, skip
            
            # Check if index already exists
            cursor.execute(f"""
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = '{table_name}' 
                AND indexname = '{index_name}'
            """)
            if cursor.fetchone():
                continue  # Index already exists, skip
            
            # Check if all required fields exist
            all_fields_exist = True
            for field in fields:
                cursor.execute(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = '{table_name}' 
                    AND column_name = '{field}'
                """)
                if not cursor.fetchone():
                    all_fields_exist = False
                    break
            
            if not all_fields_exist:
                continue  # Not all fields exist, skip creating index
            
            # Create the index
            fields_str = ', '.join(fields)
            cursor.execute(f"""
                CREATE INDEX {index_name} 
                ON {table_name} ({fields_str})
            """)


def reverse_add_indexes(apps, schema_editor):
    """Reverse: drop indexes."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        indexes_to_drop = [
            'coaching_ha_user_id_active_idx',
            'coaching_ha_user_id_type_idx',
            'coaching_hl_user_date_status_idx',
            'coaching_re_sentiment_idx',
            'coaching_ai_user_session_type_idx',
            'coaching_ai_session_created_idx',
        ]
        
        for index_name in indexes_to_drop:
            # Find which table has this index
            cursor.execute(f"""
                SELECT tablename 
                FROM pg_indexes 
                WHERE indexname = '{index_name}'
            """)
            result = cursor.fetchone()
            if result:
                table_name = result[0]
                cursor.execute(f"DROP INDEX IF EXISTS {index_name}")


def add_unique_constraints_conditionally(apps, schema_editor):
    """Conditionally add unique constraints only if all required fields exist."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # HabitLog unique constraint: (habit_id, date)
        for table_name in ['habitlogs', 'coaching_habit_logs']:
            cursor.execute(f"""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = '{table_name}'
                AND table_schema = 'public'
            """)
            if cursor.fetchone():
                # Check if fields exist
                cursor.execute(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = '{table_name}' 
                    AND column_name IN ('habit_id', 'date')
                """)
                fields = [row[0] for row in cursor.fetchall()]
                if 'habit_id' in fields and 'date' in fields:
                    # Check if constraint already exists
                    cursor.execute(f"""
                        SELECT constraint_name 
                        FROM information_schema.table_constraints 
                        WHERE table_name = '{table_name}' 
                        AND constraint_type = 'UNIQUE'
                        AND constraint_name LIKE '%habit%date%'
                    """)
                    if not cursor.fetchone():
                        cursor.execute(f"""
                            ALTER TABLE {table_name} 
                            ADD CONSTRAINT {table_name}_habit_date_unique 
                            UNIQUE (habit_id, date)
                        """)
                break
        
        # Reflection unique constraint: (user_id, date)
        for table_name in ['reflections', 'coaching_reflections']:
            cursor.execute(f"""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = '{table_name}'
                AND table_schema = 'public'
            """)
            if cursor.fetchone():
                # Check if fields exist
                cursor.execute(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = '{table_name}' 
                    AND column_name IN ('user_id', 'date')
                """)
                fields = [row[0] for row in cursor.fetchall()]
                if 'user_id' in fields and 'date' in fields:
                    # Check if constraint already exists
                    cursor.execute(f"""
                        SELECT constraint_name 
                        FROM information_schema.table_constraints 
                        WHERE table_name = '{table_name}' 
                        AND constraint_type = 'UNIQUE'
                        AND constraint_name LIKE '%user%date%'
                    """)
                    if not cursor.fetchone():
                        cursor.execute(f"""
                            ALTER TABLE {table_name} 
                            ADD CONSTRAINT {table_name}_user_date_unique 
                            UNIQUE (user_id, date)
                        """)
                break


def reverse_add_unique_constraints(apps, schema_editor):
    """Reverse: drop unique constraints."""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        constraints_to_drop = [
            ('habitlogs', 'habitlogs_habit_date_unique'),
            ('coaching_habit_logs', 'coaching_habit_logs_habit_date_unique'),
            ('reflections', 'reflections_user_date_unique'),
            ('coaching_reflections', 'coaching_reflections_user_date_unique'),
        ]
        
        for table_name, constraint_name in constraints_to_drop:
            cursor.execute(f"""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = '{table_name}' 
                AND constraint_name = '{constraint_name}'
            """)
            if cursor.fetchone():
                cursor.execute(f"ALTER TABLE {table_name} DROP CONSTRAINT IF EXISTS {constraint_name}")


class Migration(migrations.Migration):

    dependencies = [
        ('coaching', '0004_merge_20251214_1645'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Conditionally rename Habit category field to type
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    rename_category_to_type_if_exists,
                    reverse_rename_type_to_category
                ),
            ],
            state_operations=[
        migrations.RenameField(
            model_name='habit',
            old_name='category',
            new_name='type',
        ),
            ]
        ),
        # Conditionally rename other Habit fields
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    rename_habit_fields_conditionally,
                    reverse_rename_habit_fields
                ),
            ],
            state_operations=[
        migrations.RenameField(
            model_name='habit',
            old_name='streak_current',
            new_name='streak',
        ),
        migrations.RenameField(
            model_name='habit',
            old_name='streak_longest',
            new_name='longest_streak',
        ),
        migrations.RenameField(
            model_name='habit',
            old_name='target_frequency',
            new_name='frequency',
        ),
            ]
        ),
        
        # Update HabitLog - rename fields
        # Note: completed_at was already removed in migration 0002, replaced with log_date
        # Migration 0002 also added created_at. We need to rename:
        # - log_date -> date (in state, database may already be renamed)
        # - created_at -> logged_at (in state, database may already be renamed)
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    rename_habitlog_fields_conditionally,
                    reverse_rename_habitlog_fields
                ),
            ],
            state_operations=[
                # Rename log_date to date (if it exists in state)
                migrations.RenameField(
                    model_name='habitlog',
                    old_name='log_date',
                    new_name='date',
                ),
                # Rename created_at to logged_at (if it exists in state)
                migrations.RenameField(
                    model_name='habitlog',
                    old_name='created_at',
                    new_name='logged_at',
                ),
            ]
        ),
        
        # Update Reflection - rename fields
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    rename_reflection_fields_conditionally,
                    reverse_rename_reflection_fields
                ),
            ],
            state_operations=[
                # Note: prompt was already renamed to content in migration 0002
                # Remove response field since content already exists
                migrations.RemoveField(
                    model_name='reflection',
                    name='response',
                ),
                migrations.RenameField(
                    model_name='reflection',
                    old_name='sentiment_score',
                    new_name='sentiment',
                ),
                migrations.RenameField(
                    model_name='reflection',
                    old_name='behavior_tags',
                    new_name='emotion_tags',
                ),
            ]
        ),
        
        # Conditionally add all new fields (only if they don't exist)
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    add_fields_conditionally,
                    reverse_add_fields
                ),
            ],
            state_operations=[
        migrations.AddField(
            model_name='habit',
            name='is_active',
            field=models.BooleanField(db_index=True, default=True),
        ),
        migrations.AddField(
            model_name='habit',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='habitlog',
            name='date',
            field=models.DateField(db_index=True, default=django.utils.timezone.now),
        ),
        migrations.AddField(
            model_name='habitlog',
            name='status',
            field=models.CharField(
                choices=[('completed', 'Completed'), ('skipped', 'Skipped'), ('missed', 'Missed')],
                default='completed',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='goal',
            name='progress',
            field=models.IntegerField(
                default=0,
                validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)]
            ),
        ),
        migrations.AddField(
            model_name='goal',
            name='target',
            field=models.IntegerField(
                default=1,
                validators=[django.core.validators.MinValueValidator(1)]
            ),
        ),
        migrations.AddField(
            model_name='goal',
            name='current',
            field=models.IntegerField(
                default=0,
                validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
        migrations.AddField(
            model_name='goal',
            name='subscription_tier',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='goal',
            name='due_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='goal',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='reflection',
            name='date',
            field=models.DateField(db_index=True, default=django.utils.timezone.now),
        ),
        migrations.AddField(
            model_name='reflection',
            name='ai_insights',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='reflection',
            name='word_count',
            field=models.IntegerField(
                default=0,
                validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
        migrations.AddField(
            model_name='reflection',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
                ),
            ]
        ),
        
        # Remove prompt field from Reflection (conditional)
        # Note: prompt was already renamed to content in migration 0002, so we only handle database cleanup
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    remove_prompt_field_if_exists,
                    reverse_remove_prompt_field
                ),
            ],
            state_operations=[
                # No state operation needed - prompt was already renamed to content in migration 0002
            ]
        ),
        
        # Create AICoachSession
        migrations.CreateModel(
            name='AICoachSession',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('session_type', models.CharField(
                    choices=[
                        ('habit', 'Habit'),
                        ('goal', 'Goal'),
                        ('reflection', 'Reflection'),
                        ('mission', 'Mission'),
                        ('general', 'General'),
                    ],
                    db_index=True,
                    default='general',
                    max_length=20
                )),
                ('prompt_count', models.IntegerField(
                    default=0,
                    validators=[django.core.validators.MinValueValidator(0)]
                )),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='ai_coach_sessions',
                    to=settings.AUTH_USER_MODEL,
                    db_index=True
                )),
            ],
            options={
                'db_table': 'ai_coach_sessions',
                'ordering': ['-created_at'],
            },
        ),
        
        # Create AICoachMessage
        migrations.CreateModel(
            name='AICoachMessage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('role', models.CharField(
                    choices=[('user', 'User'), ('assistant', 'Assistant'), ('system', 'System')],
                    db_index=True,
                    max_length=20
                )),
                ('content', models.TextField()),
                ('context', models.CharField(blank=True, max_length=50, null=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('session', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='messages',
                    to='coaching.aicoachsession',
                    db_index=True
                )),
            ],
            options={
                'db_table': 'ai_coach_messages',
                'ordering': ['created_at'],
            },
        ),
        
        # Add indexes conditionally (only if fields exist)
        migrations.RunPython(
            add_indexes_conditionally,
            reverse_add_indexes
        ),
        
        # Add unique constraints conditionally
        migrations.RunPython(
            add_unique_constraints_conditionally,
            reverse_add_unique_constraints
        ),
    ]
