
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('curriculum', '0002_create_missing_tables_if_faked'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='curriculummodule',
            options={'ordering': ['track_key', 'order_index']},
        ),
        migrations.AlterModelOptions(
            name='lesson',
            options={'ordering': ['module', 'order_index']},
        ),
        migrations.RenameIndex(
            model_name='curriculummodule',
            new_name='curriculumm_track_k_f394bd_idx',
            old_name='curriculumm_track_k_123abc_idx',
        ),
        migrations.RenameIndex(
            model_name='curriculummodule',
            new_name='curriculumm_track_k_10406d_idx',
            old_name='curriculumm_track_k_456def_idx',
        ),
        migrations.AddField(
            model_name='userlessonprogress',
            name='id',
            field=models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
        migrations.AddField(
            model_name='usermoduleprogress',
            name='id',
            field=models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
        migrations.AddIndex(
            model_name='lesson',
            index=models.Index(fields=['module', 'order_index'], name='lessons_module__6380c9_idx'),
        ),
        migrations.AddIndex(
            model_name='userlessonprogress',
            index=models.Index(fields=['user', 'status'], name='user_lesson_user_id_64b223_idx'),
        ),
        migrations.AddIndex(
            model_name='usermoduleprogress',
            index=models.Index(fields=['user', 'status'], name='user_module_user_id_f0505a_idx'),
        ),
    ]
