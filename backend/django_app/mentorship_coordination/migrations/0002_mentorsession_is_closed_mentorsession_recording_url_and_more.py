
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mentorship_coordination', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name='mentorsession',
            name='notes',
            field=models.TextField(blank=True, help_text='Basic session notes'),
        ),
        migrations.AlterField(
            model_name='mentorsession',
            name='zoom_url',
            field=models.URLField(blank=True, help_text='Meeting link (Zoom, Google Meet, etc.)'),
        ),
    ]
