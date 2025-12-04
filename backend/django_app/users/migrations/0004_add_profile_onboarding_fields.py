"""
Add profile_complete and onboarding_complete fields to User model.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_remove_apikey_rate_limit_apikey_owner_id_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='profile_complete',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='onboarding_complete',
            field=models.BooleanField(default=False),
        ),
    ]

