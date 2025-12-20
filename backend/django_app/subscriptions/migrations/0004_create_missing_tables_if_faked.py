"""
Repair migration: create subscriptions tables if migrations were faked/applied without DDL.

Fixes runtime 500s like:
  django.db.utils.ProgrammingError: relation "payment_transactions" does not exist
"""

from django.db import migrations


def create_missing_tables(apps, schema_editor):
    existing_tables = set(schema_editor.connection.introspection.table_names())

    # Models created in 0001_initial that may be missing if migrations were faked.
    # Order matters for FK dependencies (e.g. PaymentTransaction depends on PaymentGateway).
    model_names = [
        "PaymentGateway",
        "SubscriptionRule",
        "PaymentSettings",
        "PaymentTransaction",
    ]

    for name in model_names:
        model = apps.get_model("subscriptions", name)
        table = model._meta.db_table
        if table in existing_tables:
            continue
        schema_editor.create_model(model)
        existing_tables.add(table)


class Migration(migrations.Migration):
    dependencies = [
        ("subscriptions", "0003_add_timestamps"),
    ]

    operations = [
        migrations.RunPython(create_missing_tables, migrations.RunPython.noop),
    ]









