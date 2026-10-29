from django.db import migrations


def drop_vat_columns(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute("ALTER TABLE quotes DROP COLUMN IF EXISTS vat_amount;")
        schema_editor.execute("ALTER TABLE quotes DROP COLUMN IF EXISTS vat_enabled;")


def restore_vat_columns(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute("ALTER TABLE quotes ADD COLUMN vat_amount numeric NOT NULL DEFAULT 0.00;")
        schema_editor.execute("ALTER TABLE quotes ADD COLUMN vat_enabled boolean NOT NULL DEFAULT FALSE;")


class Migration(migrations.Migration):

    dependencies = [
        ("quotes", "0005_quote_vat_amount_quote_vat_enabled")
    ]

    operations = [
        migrations.RunPython(drop_vat_columns, restore_vat_columns),
    ]
