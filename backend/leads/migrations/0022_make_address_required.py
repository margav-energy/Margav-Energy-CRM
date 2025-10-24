# Generated manually

from django.db import migrations, models


def update_null_addresses(apps, schema_editor):
    """Update null addresses to a default value before making the field required."""
    FieldSubmission = apps.get_model('leads', 'FieldSubmission')
    FieldSubmission.objects.filter(address__isnull=True).update(address='Address not provided')


def reverse_update_null_addresses(apps, schema_editor):
    """Reverse operation - no need to do anything."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('leads', '0021_make_address_optional'),
    ]

    operations = [
        migrations.RunPython(
            code=update_null_addresses,
            reverse_code=reverse_update_null_addresses,
        ),
        migrations.AlterField(
            model_name='fieldsubmission',
            name='address',
            field=models.TextField(help_text='Property address'),
        ),
    ]
