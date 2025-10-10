# Generated migration for soft delete fields

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('leads', '0009_callback'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='lead',
            name='is_deleted',
            field=models.BooleanField(default=False, help_text='Whether this object has been soft deleted'),
        ),
        migrations.AddField(
            model_name='lead',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True, help_text='When this object was soft deleted'),
        ),
        migrations.AddField(
            model_name='lead',
            name='deleted_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='deleted_leads',
                to='accounts.user',
                help_text='User who deleted this object'
            ),
        ),
        migrations.AddField(
            model_name='lead',
            name='deletion_reason',
            field=models.TextField(blank=True, null=True, help_text='Reason for deletion'),
        ),
        migrations.AddField(
            model_name='callback',
            name='is_deleted',
            field=models.BooleanField(default=False, help_text='Whether this object has been soft deleted'),
        ),
        migrations.AddField(
            model_name='callback',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True, help_text='When this object was soft deleted'),
        ),
        migrations.AddField(
            model_name='callback',
            name='deleted_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='deleted_callbacks',
                to='accounts.user',
                help_text='User who deleted this object'
            ),
        ),
        migrations.AddField(
            model_name='callback',
            name='deletion_reason',
            field=models.TextField(blank=True, null=True, help_text='Reason for deletion'),
        ),
    ]
