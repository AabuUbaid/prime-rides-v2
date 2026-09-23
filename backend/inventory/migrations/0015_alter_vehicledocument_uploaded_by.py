import mimetypes
import os

from django.db import migrations, models


def migrate_possession_certificates(apps, schema_editor):
    Car = apps.get_model("inventory", "Car")
    VehicleDocument = apps.get_model(
        "inventory",
        "VehicleDocument",
    )

    db_alias = schema_editor.connection.alias

    cars = (
        Car.objects.using(db_alias)
        .exclude(possession_certificate="")
        .exclude(possession_certificate__isnull=True)
    )

    for car in cars.iterator():
        certificate = car.possession_certificate

        if not certificate:
            continue

        original_path = certificate.name

        if not original_path:
            continue

        filename = os.path.basename(original_path)

        already_migrated = VehicleDocument.objects.using(
            db_alias,
        ).filter(
            car_id=car.pk,
            document_type="POSSESSION",
            original_filename=filename,
        ).exists()

        if already_migrated:
            continue

        storage = certificate.storage

        if not storage.exists(original_path):
            continue

        mime_type, _ = mimetypes.guess_type(filename)

        if not mime_type:
            mime_type = "application/octet-stream"

        try:
            file_size = storage.size(original_path)
        except OSError:
            file_size = 0

        VehicleDocument.objects.using(db_alias).create(
            car_id=car.pk,
            document_type="POSSESSION",
            file=original_path,
            original_filename=filename[:255],
            mime_type=mime_type[:100],
            file_size=file_size,
            uploaded_by=None,
            is_archived=False,
        )


def reverse_migrate_possession_certificates(
    apps,
    schema_editor,
):
    # The original Car.possession_certificate files are preserved.
    # The reverse operation intentionally does not delete
    # VehicleDocument records or physical files.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0014_vehicledocument"),
    ]

    operations = [
        migrations.AlterField(
            model_name="vehicledocument",
            name="uploaded_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.PROTECT,
                related_name="uploaded_vehicle_documents",
                to="accounts.user",
            ),
        ),
        migrations.RunPython(
            migrate_possession_certificates,
            reverse_migrate_possession_certificates,
        ),
    ]