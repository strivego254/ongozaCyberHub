# Generated manually - Recipe Engine initial migration
from django.conf import settings
import django.contrib.postgres.indexes
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Recipe',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(db_index=True, help_text='e.g., "Write Basic Sigma Rule"', max_length=255)),
                ('slug', models.SlugField(db_index=True, help_text='URL-friendly identifier', max_length=255, unique=True)),
                ('summary', models.TextField(help_text='1-2 sentence overview', max_length=500)),
                ('description', models.TextField(blank=True, help_text='Detailed "what this solves"')),
                ('difficulty', models.CharField(choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')], db_index=True, default='beginner', max_length=20)),
                ('estimated_minutes', models.IntegerField(help_text='Estimated completion time (5-60 minutes)', validators=[django.core.validators.MinValueValidator(5), django.core.validators.MaxValueValidator(60)])),
                ('track_codes', models.JSONField(blank=True, default=list, help_text='Array of track codes like ["SOCDEFENSE", "DFIR"]')),
                ('skill_codes', models.JSONField(default=list, help_text='Array of skill codes like ["SIEM_RULE_WRITING", "LOG_ANALYSIS"]')),
                ('tools_used', models.JSONField(blank=True, default=list, help_text='Array of tools like ["sigma", "jq", "awk"]')),
                ('prerequisites', models.JSONField(blank=True, default=list, help_text='Other recipes or knowledge prerequisites')),
                ('content', models.JSONField(help_text='Structured steps with sections: intro, prerequisites, steps, validation')),
                ('validation_steps', models.JSONField(blank=True, default=dict, help_text="How to know you're done - validation criteria")),
                ('thumbnail_url', models.URLField(blank=True, max_length=500)),
                ('mentor_curated', models.BooleanField(db_index=True, default=False)),
                ('usage_count', models.IntegerField(db_index=True, default=0)),
                ('avg_rating', models.DecimalField(decimal_places=2, default=0.0, max_digits=3, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(5)])),
                ('is_active', models.BooleanField(db_index=True, default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_recipes', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Recipe',
                'verbose_name_plural': 'Recipes',
                'db_table': 'recipes',
                'ordering': ['-usage_count', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='recipe',
            index=models.Index(fields=['slug'], name='recipes_rec_slug_idx'),
        ),
        migrations.AddIndex(
            model_name='recipe',
            index=models.Index(fields=['is_active', 'usage_count'], name='recipes_rec_is_acti_idx'),
        ),
        migrations.AddIndex(
            model_name='recipe',
            index=models.Index(fields=['difficulty', 'is_active'], name='recipes_rec_difficu_idx'),
        ),
        migrations.AddIndex(
            model_name='recipe',
            index=django.contrib.postgres.indexes.GinIndex(fields=['track_codes'], name='recipes_rec_track_c_idx'),
        ),
        migrations.AddIndex(
            model_name='recipe',
            index=django.contrib.postgres.indexes.GinIndex(fields=['skill_codes'], name='recipes_rec_skill_c_idx'),
        ),
        migrations.AddIndex(
            model_name='recipe',
            index=django.contrib.postgres.indexes.GinIndex(fields=['tools_used'], name='recipes_rec_tools_u_idx'),
        ),
        migrations.CreateModel(
            name='UserRecipeProgress',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('status', models.CharField(choices=[('started', 'Started'), ('completed', 'Completed'), ('bookmarked', 'Bookmarked')], db_index=True, default='started', max_length=20)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('rating', models.IntegerField(blank=True, help_text='User rating 1-5', null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('notes', models.TextField(blank=True, help_text='Student feedback')),
                ('time_spent_minutes', models.IntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('recipe', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_progress', to='recipes.recipe')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='recipe_progress', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'User Recipe Progress',
                'verbose_name_plural': 'User Recipe Progress',
                'db_table': 'user_recipe_progress',
                'unique_together': {('user', 'recipe')},
            },
        ),
        migrations.AddIndex(
            model_name='userrecipeprogress',
            index=models.Index(fields=['user', 'status'], name='user_recipe_user_id_status_idx'),
        ),
        migrations.AddIndex(
            model_name='userrecipeprogress',
            index=models.Index(fields=['recipe', 'status'], name='user_recipe_recipe__status_idx'),
        ),
        migrations.CreateModel(
            name='RecipeContextLink',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('context_type', models.CharField(choices=[('mission', 'Mission'), ('module', 'Module'), ('project', 'Project'), ('mentor_session', 'Mentor Session')], db_index=True, max_length=20)),
                ('context_id', models.UUIDField(db_index=True, help_text='mission_id, module_id, etc')),
                ('is_required', models.BooleanField(default=False, help_text='Required vs recommended')),
                ('position_order', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('recipe', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='context_links', to='recipes.recipe')),
            ],
            options={
                'verbose_name': 'Recipe Context Link',
                'verbose_name_plural': 'Recipe Context Links',
                'db_table': 'recipe_context_links',
            },
        ),
        migrations.AddIndex(
            model_name='recipecontextlink',
            index=models.Index(fields=['context_type', 'context_id', 'position_order'], name='recipe_cont_context__idx'),
        ),
        migrations.AddIndex(
            model_name='recipecontextlink',
            index=models.Index(fields=['recipe', 'context_type'], name='recipe_cont_recipe__idx'),
        ),
        migrations.CreateModel(
            name='UserRecipeBookmark',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('bookmarked_at', models.DateTimeField(auto_now_add=True)),
                ('recipe', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookmarks', to='recipes.recipe')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='recipe_bookmarks', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'User Recipe Bookmark',
                'verbose_name_plural': 'User Recipe Bookmarks',
                'db_table': 'user_recipe_bookmarks',
                'unique_together': {('user', 'recipe')},
            },
        ),
        migrations.AddIndex(
            model_name='userrecipebookmark',
            index=models.Index(fields=['user', '-bookmarked_at'], name='user_recipe_user_id_bookma_idx'),
        ),
    ]


