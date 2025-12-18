"""
Repair migration: create curriculum tables if migrations were faked/applied without DDL.

Fixes runtime 500s like:
  django.db.utils.ProgrammingError: relation "user_module_progress" does not exist

This can happen when `curriculum.0001_initial` is marked as applied in `django_migrations`
but the underlying tables were never created.
"""

from django.db import migrations


def create_missing_tables(apps, schema_editor):
    existing_tables = set(schema_editor.connection.introspection.table_names())

    # Models created in 0001_initial that must exist for cascades and deletes.
    model_names = [
        "CurriculumModule",
        "Lesson",
        "UserModuleProgress",
        "UserLessonProgress",
    ]

    for name in model_names:
        model = apps.get_model("curriculum", name)
        table = model._meta.db_table
        if table in existing_tables:
            continue
        schema_editor.create_model(model)
        existing_tables.add(table)


class Migration(migrations.Migration):
    dependencies = [
        ("curriculum", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_missing_tables, migrations.RunPython.noop),
    ]







