# Generated migration for Coaching OS full schema
import django.core.validators
import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('coaching', '0004_merge_20251214_1645'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Rename Habit fields
        migrations.RenameField(
            model_name='habit',
            old_name='category',
            new_name='type',
        ),
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
        
        # Add new Habit fields
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
        
        # Update HabitLog - rename and add fields
        # Note: completed_at was already removed in migration 0002, so skip this rename
        # migrations.RenameField(
        #     model_name='habitlog',
        #     old_name='completed_at',
        #     new_name='logged_at',
        # ),
        # Rename log_date (from migration 0002) to date (current model uses 'date')
        migrations.RenameField(
            model_name='habitlog',
            old_name='log_date',
            new_name='date',
        ),
        # Note: status field was already added in migration 0002, but with different choices
        # This migration updates it with new choices
        migrations.AlterField(
            model_name='habitlog',
            name='status',
            field=models.CharField(
                choices=[('completed', 'Completed'), ('skipped', 'Skipped'), ('missed', 'Missed')],
                default='completed',
                max_length=20
            ),
        ),
        # Add logged_at field (auto_now_add timestamp)
        migrations.AddField(
            model_name='habitlog',
            name='logged_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        
        # Update Goal - add fields
        migrations.RenameField(
            model_name='goal',
            old_name='type',
            new_name='type',
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
        
        # Update Reflection - rename and add fields
        # Note: content field already exists from migration 0002 (renamed from prompt)
        # So we skip this rename if content already exists, or if response doesn't exist
        # migrations.RenameField(
        #     model_name='reflection',
        #     old_name='response',
        #     new_name='content',
        # ),
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
        # Note: prompt field was already renamed to content in migration 0002, so skip this removal
        # migrations.RemoveField(
        #     model_name='reflection',
        #     name='prompt',
        # ),
        migrations.AddField(
            model_name='reflection',
            name='date',
            field=models.DateField(db_index=True, default=django.utils.timezone.now),
            preserve_default=False,
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
        
        # Add indexes
        migrations.AddIndex(
            model_name='habit',
            index=models.Index(fields=['user', 'is_active'], name='coaching_ha_user_id_active_idx'),
        ),
        migrations.AddIndex(
            model_name='habit',
            index=models.Index(fields=['user', 'type'], name='coaching_ha_user_id_type_idx'),
        ),
        migrations.AddIndex(
            model_name='habitlog',
            index=models.Index(fields=['user', 'date', 'status'], name='coaching_hl_user_date_status_idx'),
        ),
        migrations.AddIndex(
            model_name='reflection',
            index=models.Index(fields=['sentiment'], name='coaching_re_sentiment_idx'),
        ),
        migrations.AddIndex(
            model_name='aicoachsession',
            index=models.Index(fields=['user', 'session_type'], name='coaching_ai_user_session_type_idx'),
        ),
        migrations.AddIndex(
            model_name='aicoachmessage',
            index=models.Index(fields=['session', 'created_at'], name='coaching_ai_session_created_idx'),
        ),
        
        # Add unique constraints
        migrations.AlterUniqueTogether(
            name='habitlog',
            unique_together={('habit', 'date')},
        ),
        migrations.AlterUniqueTogether(
            name='reflection',
            unique_together={('user', 'date')},
        ),
    ]
