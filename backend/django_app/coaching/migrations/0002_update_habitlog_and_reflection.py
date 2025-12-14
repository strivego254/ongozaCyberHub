# Generated manually to handle model changes
# - HabitLog: completed_at -> log_date, add status, add created_at, remove notes
# - Reflection: prompt -> content

import django.utils.timezone
from django.db import migrations, models


def migrate_completed_at_to_log_date(apps, schema_editor):
    """Migrate data from completed_at to log_date (extract date portion)."""
    HabitLog = apps.get_model('coaching', 'HabitLog')
    for log in HabitLog.objects.all():
        if log.completed_at:
            log.log_date = log.completed_at.date()
            log.save()


def reverse_migrate_log_date_to_completed_at(apps, schema_editor):
    """Reverse migration: create completed_at from log_date."""
    HabitLog = apps.get_model('coaching', 'HabitLog')
    for log in HabitLog.objects.all():
        if log.log_date:
            from django.utils import timezone
            log.completed_at = timezone.make_aware(
                timezone.datetime.combine(log.log_date, timezone.datetime.min.time())
            )
            log.save()


class Migration(migrations.Migration):

    dependencies = [
        ('coaching', '0001_initial'),
    ]

    operations = [
        # Add status field first
        migrations.AddField(
            model_name='habitlog',
            name='status',
            field=models.CharField(
                choices=[('done', 'Done'), ('skipped', 'Skipped')],
                default='done',
                max_length=20
            ),
        ),
        
        # Add log_date field (nullable initially)
        migrations.AddField(
            model_name='habitlog',
            name='log_date',
            field=models.DateField(blank=True, null=True, db_index=True),
        ),
        
        # Migrate data: extract date from completed_at to log_date
        migrations.RunPython(
            migrate_completed_at_to_log_date,
            reverse_migrate_log_date_to_completed_at,
        ),
        
        # Remove notes field
        migrations.RemoveField(
            model_name='habitlog',
            name='notes',
        ),
        
        # Remove completed_at field (after data migration)
        migrations.RemoveField(
            model_name='habitlog',
            name='completed_at',
        ),
        
        # Make log_date non-nullable after data migration
        migrations.AlterField(
            model_name='habitlog',
            name='log_date',
            field=models.DateField(db_index=True),
        ),
        
        # Add created_at field with default (will be set by user input during makemigrations)
        migrations.AddField(
            model_name='habitlog',
            name='created_at',
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now
            ),
        ),
        
        # Rename reflection.prompt to reflection.content
        migrations.RenameField(
            model_name='reflection',
            old_name='prompt',
            new_name='content',
        ),
        
        # Change created_at to auto_now_add only (remove default after initial data)
        migrations.AlterField(
            model_name='habitlog',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
    ]
