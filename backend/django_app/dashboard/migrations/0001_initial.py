# Generated migration for dashboard app
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ReadinessScore',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('score', models.IntegerField(default=0)),
                ('max_score', models.IntegerField(default=100)),
                ('trend', models.FloatField(default=0.0)),
                ('trend_direction', models.CharField(choices=[('up', 'Up'), ('down', 'Down'), ('stable', 'Stable')], default='stable', max_length=10)),
                ('countdown_days', models.IntegerField(default=0)),
                ('countdown_label', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='readiness_scores', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'readiness_scores',
                'ordering': ['-updated_at'],
            },
        ),
        migrations.CreateModel(
            name='CohortProgress',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('cohort_id', models.UUIDField(blank=True, db_index=True, null=True)),
                ('percentage', models.FloatField(default=0.0)),
                ('current_module', models.CharField(blank=True, max_length=255)),
                ('total_modules', models.IntegerField(default=0)),
                ('completed_modules', models.IntegerField(default=0)),
                ('estimated_time_remaining', models.IntegerField(default=0)),
                ('graduation_date', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cohort_progress', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'cohort_progress',
            },
        ),
        migrations.CreateModel(
            name='PortfolioItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='portfolio_items', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'portfolio_items',
            },
        ),
        migrations.CreateModel(
            name='MentorshipSession',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('mentor_name', models.CharField(max_length=255)),
                ('mentor_avatar', models.URLField(blank=True)),
                ('session_type', models.CharField(choices=[('1-on-1', '1-on-1'), ('group', 'Group'), ('review', 'Review')], default='1-on-1', max_length=20)),
                ('next_session_date', models.DateField()),
                ('next_session_time', models.TimeField()),
                ('status', models.CharField(choices=[('scheduled', 'Scheduled'), ('pending', 'Pending'), ('completed', 'Completed')], default='pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mentorship_sessions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'mentorship_sessions',
            },
        ),
        migrations.CreateModel(
            name='GamificationPoints',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('points', models.IntegerField(default=0)),
                ('streak', models.IntegerField(default=0)),
                ('badges', models.IntegerField(default=0)),
                ('rank', models.CharField(blank=True, max_length=50)),
                ('level', models.CharField(blank=True, max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='gamification_points', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'gamification_points',
            },
        ),
        migrations.CreateModel(
            name='DashboardEvent',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('date', models.DateField()),
                ('time', models.TimeField(blank=True, null=True)),
                ('event_type', models.CharField(choices=[('mission_due', 'Mission Due'), ('mentor_session', 'Mentor Session'), ('review_meeting', 'Review Meeting'), ('ctf', 'CTF'), ('workshop', 'Workshop')], max_length=50)),
                ('urgency', models.CharField(choices=[('high', 'High'), ('medium', 'Medium'), ('low', 'Low')], default='medium', max_length=10)),
                ('rsvp_required', models.BooleanField(default=False)),
                ('rsvp_status', models.CharField(blank=True, choices=[('accepted', 'Accepted'), ('declined', 'Declined'), ('pending', 'Pending')], max_length=20, null=True)),
                ('action_url', models.URLField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='dashboard_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'dashboard_events',
            },
        ),
        migrations.CreateModel(
            name='CommunityActivity',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('user_display_name', models.CharField(max_length=255)),
                ('action', models.CharField(max_length=255)),
                ('activity_type', models.CharField(choices=[('mission_completed', 'Mission Completed'), ('ctf_launched', 'CTF Launched'), ('badge_earned', 'Badge Earned'), ('milestone_reached', 'Milestone Reached')], max_length=50)),
                ('likes', models.IntegerField(default=0)),
                ('action_url', models.URLField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='community_activities', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'community_activities',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='readinessscore',
            index=models.Index(fields=['user', '-updated_at'], name='readiness_s_user_id_updated_idx'),
        ),
        migrations.AddIndex(
            model_name='cohortprogress',
            index=models.Index(fields=['user', 'cohort_id'], name='cohort_prog_user_id_cohort_idx'),
        ),
        migrations.AddIndex(
            model_name='portfolioitem',
            index=models.Index(fields=['user', 'status', '-created_at'], name='portfolio_i_user_id_status_created_idx'),
        ),
        migrations.AddIndex(
            model_name='mentorshipsession',
            index=models.Index(fields=['user', 'next_session_date', '-created_at'], name='mentorship__user_id_next_s_created_idx'),
        ),
        migrations.AddIndex(
            model_name='gamificationpoints',
            index=models.Index(fields=['user', '-points'], name='gamificatio_user_id_points_idx'),
        ),
        migrations.AddIndex(
            model_name='dashboardevent',
            index=models.Index(fields=['user', 'date', '-created_at'], name='dashboard_e_user_id_date_created_idx'),
        ),
        migrations.AddIndex(
            model_name='dashboardevent',
            index=models.Index(fields=['date', 'urgency'], name='dashboard_e_date_urgency_idx'),
        ),
        migrations.AddIndex(
            model_name='communityactivity',
            index=models.Index(fields=['-created_at'], name='community_a_created_at_idx'),
        ),
        migrations.AddIndex(
            model_name='communityactivity',
            index=models.Index(fields=['activity_type', '-created_at'], name='community_a_activity_created_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='cohortprogress',
            unique_together={('user', 'cohort_id')},
        ),
        migrations.AlterUniqueTogether(
            name='gamificationpoints',
            unique_together={('user',)},
        ),
    ]

