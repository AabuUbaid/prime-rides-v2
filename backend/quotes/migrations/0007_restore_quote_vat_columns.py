from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("quotes", "0006_remove_orphan_quote_vat_columns"),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                """
                ALTER TABLE quotes
                ADD COLUMN IF NOT EXISTS vat_amount
                numeric(12, 2) NOT NULL DEFAULT 0.00;
                """,
                """
                ALTER TABLE quotes
                ADD COLUMN IF NOT EXISTS vat_enabled
                boolean NOT NULL DEFAULT FALSE;
                """,
            ],
            reverse_sql=[
                """
                ALTER TABLE quotes
                DROP COLUMN IF EXISTS vat_amount;
                """,
                """
                ALTER TABLE quotes
                DROP COLUMN IF EXISTS vat_enabled;
                """,
            ],
        ),
    ]