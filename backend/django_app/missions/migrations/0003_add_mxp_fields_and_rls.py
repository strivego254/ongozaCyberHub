"""
Add MXP fields and RLS policies for missions.
"""
from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('missions', '0002_initial'),
    ]

    operations = [
        # Add new fields to Mission
        migrations.AddField(
            model_name='mission',
            name='code',
            field=models.CharField(db_index=True, help_text='Mission code like "SIEM-03"', max_length=50, unique=True, null=True),
        ),
        migrations.AddField(
            model_name='mission',
            name='type',
            field=models.CharField(choices=[('lab', 'Lab'), ('scenario', 'Scenario'), ('project', 'Project'), ('capstone', 'Capstone')], db_index=True, default='lab', max_length=20),
        ),
        migrations.AddField(
            model_name='mission',
            name='track_key',
            field=models.CharField(blank=True, db_index=True, help_text='Track key like "soc_analyst"', max_length=50),
        ),
        migrations.AddField(
            model_name='mission',
            name='estimated_time_minutes',
            field=models.IntegerField(blank=True, help_text='Estimated minutes to complete', null=True, validators=[django.core.validators.MinValueValidator(1)]),
        ),
        migrations.AddField(
            model_name='mission',
            name='requirements',
            field=models.JSONField(blank=True, default=dict, help_text='Mission requirements template, file types, etc.'),
        ),
        
        # Update MissionSubmission (no rename needed, just field changes)
        migrations.AddField(
            model_name='missionsubmission',
            name='mentor_score',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Mentor review score 0-100', max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)]),
        ),
        migrations.AddField(
            model_name='missionsubmission',
            name='portfolio_item_id',
            field=models.UUIDField(blank=True, help_text='Auto-linked on approval', null=True),
        ),
        migrations.AddField(
            model_name='missionsubmission',
            name='ai_reviewed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='missionsubmission',
            name='mentor_reviewed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='missionsubmission',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='missionsubmission',
            name='status',
            field=models.CharField(choices=[('draft', 'Draft'), ('submitted', 'Submitted'), ('ai_reviewed', 'AI Reviewed'), ('in_ai_review', 'In AI Review'), ('mentor_review', 'Mentor Review'), ('in_mentor_review', 'In Mentor Review'), ('approved', 'Approved'), ('failed', 'Failed'), ('rejected', 'Rejected'), ('revised', 'Revised')], db_index=True, default='draft', max_length=20),
        ),
        migrations.AlterField(
            model_name='missionsubmission',
            name='ai_score',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='AI review score 0-100', max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)]),
        ),
        migrations.AlterField(
            model_name='missionsubmission',
            name='notes',
            field=models.TextField(blank=True, help_text='Student notes to reviewer'),
        ),
        
        # Create MissionArtifact model
        migrations.CreateModel(
            name='MissionArtifact',
            fields=[
                ('id', models.UUIDField(editable=False, primary_key=True, serialize=False)),
                ('type', models.CharField(choices=[('file', 'File'), ('github', 'GitHub'), ('notebook', 'Notebook'), ('video', 'Video'), ('screenshot', 'Screenshot')], db_index=True, max_length=20)),
                ('url', models.URLField(help_text='S3 signed URL, GitHub link, or video URL', max_length=500)),
                ('filename', models.CharField(blank=True, max_length=255)),
                ('size_bytes', models.BigIntegerField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, default=dict, help_text='Additional metadata')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('submission', models.ForeignKey(db_index=True, on_delete=models.CASCADE, related_name='artifacts', to='missions.missionsubmission')),
            ],
            options={
                'db_table': 'mission_artifacts',
            },
        ),
        
        # Create AIFeedback model
        migrations.CreateModel(
            name='AIFeedback',
            fields=[
                ('id', models.UUIDField(editable=False, primary_key=True, serialize=False)),
                ('score', models.DecimalField(decimal_places=2, help_text='AI score 0-100', max_digits=5, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('strengths', models.JSONField(blank=True, default=list, help_text='List of strengths')),
                ('gaps', models.JSONField(blank=True, default=list, help_text='List of gaps')),
                ('suggestions', models.JSONField(blank=True, default=list, help_text='List of suggestions')),
                ('competencies_detected', models.JSONField(blank=True, default=list, help_text='Detected competencies with levels')),
                ('full_feedback', models.JSONField(blank=True, default=dict, help_text='Structured feedback (correctness, missed_requirements, etc.)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('submission', models.OneToOneField(db_index=True, on_delete=models.CASCADE, related_name='ai_feedback_detail', to='missions.missionsubmission')),
            ],
            options={
                'db_table': 'ai_feedback',
            },
        ),
        
        # Add indexes for performance
        migrations.AddIndex(
            model_name='mission',
            index=models.Index(fields=['track_key', 'difficulty'], name='missions_mission_track_difficulty_idx'),
        ),
        migrations.AddIndex(
            model_name='mission',
            index=models.Index(fields=['code'], name='missions_mission_code_idx'),
        ),
        migrations.AddIndex(
            model_name='missionsubmission',
            index=models.Index(fields=['user', 'mission'], name='missions_submission_user_mission_idx'),
        ),
        migrations.AddIndex(
            model_name='missionsubmission',
            index=models.Index(fields=['user', 'status'], name='missions_submission_user_status_idx'),
        ),
        migrations.AddIndex(
            model_name='missionsubmission',
            index=models.Index(fields=['mission', 'status'], name='missions_submission_mission_status_idx'),
        ),
        migrations.AddIndex(
            model_name='missionartifact',
            index=models.Index(fields=['submission', 'type'], name='missions_artifact_submission_type_idx'),
        ),
        migrations.AddIndex(
            model_name='missionartifact',
            index=models.Index(fields=['submission', 'created_at'], name='missions_artifact_submission_created_idx'),
        ),
        
        # RLS Policies
        migrations.RunSQL(
            # Enable RLS on mission_submissions
            """
            ALTER TABLE mission_submissions ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY mission_submission_policy ON mission_submissions
                FOR ALL
                USING (user_id = auth.uid());
            """,
            reverse_sql="""
            DROP POLICY IF EXISTS mission_submission_policy ON mission_submissions;
            ALTER TABLE mission_submissions DISABLE ROW LEVEL SECURITY;
            """
        ),
        migrations.RunSQL(
            # Enable RLS on mission_artifacts
            """
            ALTER TABLE mission_artifacts ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY mission_artifact_policy ON mission_artifacts
                FOR ALL
                USING (
                    EXISTS (
                        SELECT 1 FROM mission_submissions ms
                        WHERE ms.id = mission_artifacts.submission_id
                        AND ms.user_id = auth.uid()
                    )
                );
            """,
            reverse_sql="""
            DROP POLICY IF EXISTS mission_artifact_policy ON mission_artifacts;
            ALTER TABLE mission_artifacts DISABLE ROW LEVEL SECURITY;
            """
        ),
        migrations.RunSQL(
            # Enable RLS on ai_feedback
            """
            ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY ai_feedback_policy ON ai_feedback
                FOR ALL
                USING (
                    EXISTS (
                        SELECT 1 FROM mission_submissions ms
                        WHERE ms.id = ai_feedback.submission_id
                        AND ms.user_id = auth.uid()
                    )
                );
            """,
            reverse_sql="""
            DROP POLICY IF EXISTS ai_feedback_policy ON ai_feedback;
            ALTER TABLE ai_feedback DISABLE ROW LEVEL SECURITY;
            """
        ),
    ]

