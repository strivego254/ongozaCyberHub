"""
Repair migration: create student_dashboard tables if migrations were faked/applied without DDL.

We have seen environments where `student_dashboard.0001_initial` is recorded as applied in
`django_migrations` but the underlying tables do not exist. That breaks operations like
deleting a Mission (which cascades into StudentMissionProgress).
"""

from django.db import migrations


def create_missing_tables(apps, schema_editor):
    existing_tables = set(schema_editor.connection.introspection.table_names())

    # These models are created in 0001_initial but may be missing if migrations were faked.
    model_names = [
        "StudentDashboardCache",
        "DashboardUpdateQueue",
        "StudentMissionProgress",
    ]

    for name in model_names:
        model = apps.get_model("student_dashboard", name)
        table = model._meta.db_table
        if table in existing_tables:
            continue
        schema_editor.create_model(model)
        existing_tables.add(table)


class Migration(migrations.Migration):
    dependencies = [
        ("student_dashboard", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_missing_tables, migrations.RunPython.noop),
    ]





























