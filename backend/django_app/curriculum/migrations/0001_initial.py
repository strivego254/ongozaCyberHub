"""
Initial migration for curriculum app with RLS policies.
"""
from django.db import migrations, models
import django.core.validators
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CurriculumModule',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('track_key', models.CharField(db_index=True, help_text='Track key like "soc_analyst"', max_length=50)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('is_core', models.BooleanField(default=True, help_text='Core vs optional module')),
                ('order_index', models.IntegerField(default=0, help_text='Order within track')),
                ('estimated_time_minutes', models.IntegerField(blank=True, help_text='Estimated minutes to complete', null=True, validators=[django.core.validators.MinValueValidator(1)])),
                ('competencies', models.JSONField(blank=True, default=list, help_text='["SIEM", "Alerting", "IR"]')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'curriculummodules',
            },
        ),
        migrations.CreateModel(
            name='Lesson',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('content_url', models.URLField(blank=True, help_text='URL to lesson content')),
                ('order_index', models.IntegerField(default=0, help_text='Order within module')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('module', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='lessons', to='curriculum.curriculummodule')),
            ],
            options={
                'db_table': 'lessons',
            },
        ),
        migrations.CreateModel(
            name='UserModuleProgress',
            fields=[
                ('user', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='module_progress', to='users.user')),
                ('module', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='user_progress', to='curriculum.curriculummodule')),
                ('status', models.CharField(choices=[('not_started', 'Not Started'), ('in_progress', 'In Progress'), ('completed', 'Completed')], db_index=True, default='not_started', max_length=20)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'db_table': 'user_module_progress',
            },
        ),
        migrations.CreateModel(
            name='UserLessonProgress',
            fields=[
                ('user', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='lesson_progress', to='users.user')),
                ('lesson', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='user_progress', to='curriculum.lesson')),
                ('status', models.CharField(choices=[('not_started', 'Not Started'), ('in_progress', 'In Progress'), ('completed', 'Completed')], db_index=True, default='not_started', max_length=20)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'db_table': 'user_lesson_progress',
            },
        ),
        migrations.AddIndex(
            model_name='curriculummodule',
            index=models.Index(fields=['track_key', 'order_index'], name='curriculumm_track_k_123abc_idx'),
        ),
        migrations.AddIndex(
            model_name='curriculummodule',
            index=models.Index(fields=['track_key', 'is_core'], name='curriculumm_track_k_456def_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='usermoduleprogress',
            unique_together={('user', 'module')},
        ),
        migrations.AlterUniqueTogether(
            name='userlessonprogress',
            unique_together={('user', 'lesson')},
        ),
        migrations.RunSQL(
            sql=[
                ("ALTER TABLE user_module_progress ENABLE ROW LEVEL SECURITY;", []),
                ("""
                CREATE POLICY user_module_progress_isolation ON user_module_progress
                FOR ALL
                USING (auth.uid() = user_id);
                """, []),
            ],
            reverse_sql=[
                ("DROP POLICY IF EXISTS user_module_progress_isolation ON user_module_progress;", []),
                ("ALTER TABLE user_module_progress DISABLE ROW LEVEL SECURITY;", []),
            ],
        ),
        migrations.RunSQL(
            sql=[
                ("ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;", []),
                ("""
                CREATE POLICY user_lesson_progress_isolation ON user_lesson_progress
                FOR ALL
                USING (auth.uid() = user_id);
                """, []),
            ],
            reverse_sql=[
                ("DROP POLICY IF EXISTS user_lesson_progress_isolation ON user_lesson_progress;", []),
                ("ALTER TABLE user_lesson_progress DISABLE ROW LEVEL SECURITY;", []),
            ],
        ),
    ]

