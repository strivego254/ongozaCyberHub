# Generated migration for MXP models
from django.db import migrations, models
import django.core.validators
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('missions', '0003_add_missing_columns'),
        ('users', '0001_initial'),
    ]

    operations = [
        # Add new fields to Mission model
        migrations.AddField(
            model_name='mission',
            name='story',
            field=models.TextField(blank=True, help_text='Narrative context for the mission'),
        ),
        migrations.AddField(
            model_name='mission',
            name='objectives',
            field=models.JSONField(blank=True, default=list, help_text='Array of mission objectives'),
        ),
        migrations.AddField(
            model_name='mission',
            name='subtasks',
            field=models.JSONField(blank=True, default=list, help_text='Array of subtasks with dependencies and evidence_schema'),
        ),
        migrations.AddField(
            model_name='mission',
            name='track',
            field=models.CharField(blank=True, choices=[('defender', 'Defender'), ('offensive', 'Offensive'), ('grc', 'GRC'), ('innovation', 'Innovation'), ('leadership', 'Leadership')], db_index=True, help_text='Track: defender, offensive, grc, innovation, leadership', max_length=20),
        ),
        migrations.AddField(
            model_name='mission',
            name='tier',
            field=models.CharField(blank=True, choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced'), ('mastery', 'Mastery'), ('capstone', 'Capstone')], db_index=True, help_text='Tier: beginner, intermediate, advanced, mastery, capstone', max_length=20),
        ),
        migrations.AddField(
            model_name='mission',
            name='requires_mentor_review',
            field=models.BooleanField(default=False, help_text='Requires premium mentor review'),
        ),
        migrations.AddField(
            model_name='mission',
            name='recipe_recommendations',
            field=models.JSONField(blank=True, default=list, help_text='Array of recipe IDs for micro-skills'),
        ),
        migrations.AddField(
            model_name='mission',
            name='success_criteria',
            field=models.JSONField(blank=True, default=dict, help_text='Rubric criteria for scoring'),
        ),
        migrations.AddField(
            model_name='mission',
            name='is_active',
            field=models.BooleanField(db_index=True, default=True),
        ),
        migrations.AddField(
            model_name='mission',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        
        # Create MissionProgress model
        migrations.CreateModel(
            name='MissionProgress',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('status', models.CharField(choices=[('locked', 'Locked'), ('available', 'Available'), ('in_progress', 'In Progress'), ('submitted', 'Submitted'), ('ai_reviewed', 'AI Reviewed'), ('mentor_review', 'Mentor Review'), ('approved', 'Approved'), ('failed', 'Failed'), ('revision_requested', 'Revision Requested')], db_index=True, default='locked', max_length=20)),
                ('current_subtask', models.IntegerField(default=1, help_text='Current subtask number (1-indexed)')),
                ('subtasks_progress', models.JSONField(blank=True, default=dict, help_text='{1: {completed: true, evidence: []}, ...}')),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('submitted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('ai_score', models.DecimalField(blank=True, decimal_places=2, help_text='AI review score 0-100', max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('mentor_score', models.DecimalField(blank=True, decimal_places=2, help_text='Mentor review score 0-100', max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('final_status', models.CharField(blank=True, choices=[('pass', 'Pass'), ('fail', 'Fail'), ('pending', 'Pending')], max_length=20, null=True)),
                ('reflection', models.TextField(blank=True, help_text='Student reflection on mission')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('mission', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='progress_entries', to='missions.mission')),
                ('user', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='mxp_mission_progress', to='users.user')),
            ],
            options={
                'db_table': 'mission_progress',
            },
        ),
        migrations.AddIndex(
            model_name='missionprogress',
            index=models.Index(fields=['user', 'status'], name='mission_pro_user_id_status_idx'),
        ),
        migrations.AddIndex(
            model_name='missionprogress',
            index=models.Index(fields=['mission', 'status'], name='mission_pro_mission_status_idx'),
        ),
        migrations.AddIndex(
            model_name='missionprogress',
            index=models.Index(fields=['user', 'mission'], name='mission_pro_user_id_mission_idx'),
        ),
        migrations.AddIndex(
            model_name='missionprogress',
            index=models.Index(fields=['user', 'final_status'], name='mission_pro_user_id_final_status_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='missionprogress',
            unique_together={('mission', 'user')},
        ),
        
        # Create MissionFile model
        migrations.CreateModel(
            name='MissionFile',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('subtask_number', models.IntegerField(help_text='Subtask number this file belongs to', validators=[django.core.validators.MinValueValidator(1)])),
                ('file_url', models.URLField(help_text='S3 or storage URL', max_length=500)),
                ('file_type', models.CharField(choices=[('log', 'Log File'), ('screenshot', 'Screenshot'), ('report', 'Report'), ('code', 'Code'), ('video', 'Video'), ('other', 'Other')], default='other', max_length=50)),
                ('filename', models.CharField(max_length=255)),
                ('file_size', models.BigIntegerField(blank=True, help_text='Size in bytes', null=True)),
                ('metadata', models.JSONField(blank=True, default=dict, help_text='Additional file metadata')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('mission_progress', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='files', to='missions.missionprogress')),
            ],
            options={
                'db_table': 'mission_files',
            },
        ),
        migrations.AddIndex(
            model_name='missionfile',
            index=models.Index(fields=['mission_progress', 'subtask_number'], name='mission_fil_mission_subtask_idx'),
        ),
        migrations.AddIndex(
            model_name='missionfile',
            index=models.Index(fields=['mission_progress', 'uploaded_at'], name='mission_fil_mission_uploaded_idx'),
        ),
    ]

