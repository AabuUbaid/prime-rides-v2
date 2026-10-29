from django.db import migrations


def restore_vat_columns(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(
            "ALTER TABLE quotes ADD COLUMN IF NOT EXISTS vat_amount numeric(12, 2) NOT NULL DEFAULT 0.00;"
        )
        schema_editor.execute(
            "ALTER TABLE quotes ADD COLUMN IF NOT EXISTS vat_enabled boolean NOT NULL DEFAULT FALSE;"
        )


def drop_vat_columns(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute("ALTER TABLE quotes DROP COLUMN IF EXISTS vat_amount;")
        schema_editor.execute("ALTER TABLE quotes DROP COLUMN IF EXISTS vat_enabled;")


class Migration(migrations.Migration):

    dependencies = [
        ("quotes", "0006_remove_orphan_quote_vat_columns"),
    ]

    operations = [
        migrations.RunPython(restore_vat_columns, drop_vat_columns),
    ]
