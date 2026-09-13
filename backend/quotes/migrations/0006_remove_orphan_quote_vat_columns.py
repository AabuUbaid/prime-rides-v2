from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("quotes", "0005_quote_vat_amount_quote_vat_enabled")
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                "ALTER TABLE quotes DROP COLUMN IF EXISTS vat_amount;",
                "ALTER TABLE quotes DROP COLUMN IF EXISTS vat_enabled;",
            ],
            reverse_sql=[
                """
                ALTER TABLE quotes
                ADD COLUMN vat_amount numeric NOT NULL DEFAULT 0.00;
                """,
                """
                ALTER TABLE quotes
                ADD COLUMN vat_enabled boolean NOT NULL DEFAULT FALSE;
                """,
            ],
        ),
    ]