from django.db import migrations
import mimetypes
import os


def migrate_legacy_possession_documents(apps, schema_editor):
    Car = apps.get_model(
        "inventory",
        "Car",
    )

    VehicleDocument = apps.get_model(
        "inventory",
        "VehicleDocument",
    )

    cars = (
        Car.objects
        .exclude(
            possession_certificate=""
        )
        .exclude(
            possession_certificate__isnull=True
        )
    )

    for car in cars:
        file_name = car.possession_certificate.name

        if not file_name:
            continue

        already_exists = VehicleDocument.objects.filter(
            car=car,
            document_type="POSSESSION",
            file=file_name,
        ).exists()

        if already_exists:
            continue

        try:
            file_size = car.possession_certificate.size
        except Exception:
            file_size = 0

        mime_type = (
            mimetypes.guess_type(file_name)[0]
            or "application/octet-stream"
        )

        VehicleDocument.objects.create(
            car=car,
            document_type="POSSESSION",
            file=file_name,
            original_filename=os.path.basename(
                file_name
            ),
            mime_type=mime_type,
            file_size=file_size or 0,
            uploaded_by=None,
        )


class Migration(migrations.Migration):

    dependencies = [
        (
            "inventory",
            "0018_procurementcheck",
        ),
    ]

    operations = [
        migrations.RunPython(
            migrate_legacy_possession_documents,
            migrations.RunPython.noop,
        ),
    ]