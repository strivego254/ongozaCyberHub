# Generated migration to add owner_type and owner_id to APIKey model

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_career_goals_user_cyber_exposure_level_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='apikey',
            name='owner_type',
            field=models.CharField(
                choices=[('user', 'User'), ('org', 'Organization'), ('service', 'Service Account')],
                default='user',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='apikey',
            name='owner_id',
            field=models.UUIDField(blank=True, db_index=True, null=True),
        ),
        # Also update key_hash max_length to match model (128 instead of 64)
        migrations.AlterField(
            model_name='apikey',
            name='key_hash',
            field=models.CharField(db_index=True, max_length=128, unique=True),
        ),
        # Rename rate_limit to rate_limit_per_min to match model
        migrations.RenameField(
            model_name='apikey',
            old_name='rate_limit',
            new_name='rate_limit_per_min',
        ),
        # Update default value for rate_limit_per_min
        migrations.AlterField(
            model_name='apikey',
            name='rate_limit_per_min',
            field=models.IntegerField(default=60),
        ),
    ]

