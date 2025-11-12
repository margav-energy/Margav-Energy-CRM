# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('leads', '0025_add_assigned_agent_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='lead',
            name='preferred_contact_time',
            field=models.CharField(blank=True, help_text='Preferred contact time', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='property_ownership',
            field=models.CharField(blank=True, choices=[('yes', 'Yes'), ('no', 'No')], help_text='Do you own the property?', max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='lives_with_partner',
            field=models.BooleanField(blank=True, help_text='Do you live there with a partner?', null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='age_range_18_74',
            field=models.BooleanField(blank=True, help_text='Are you between 18-74 years old?', null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='moving_within_5_years',
            field=models.BooleanField(blank=True, help_text='Are you planning on moving within the next 5 years?', null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='loft_conversions',
            field=models.BooleanField(blank=True, help_text='Any loft conversions?', null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='velux_windows',
            field=models.BooleanField(blank=True, help_text='Any velux windows?', null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='dormers',
            field=models.BooleanField(blank=True, help_text='Any dormers?', null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='dormas_shading_windows',
            field=models.BooleanField(blank=True, help_text='Any dormas shading windows?', null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='spray_foam_roof',
            field=models.BooleanField(blank=True, help_text='Any spray foam in the roof?', null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='building_work_roof',
            field=models.BooleanField(blank=True, help_text='Are you planning any building work on your roof?', null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='monthly_electricity_spend',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Current monthly electricity spend (over £60)', max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='employment_status',
            field=models.CharField(blank=True, choices=[('employed', 'Employed'), ('unemployed', 'Unemployed'), ('self-employed', 'Self-Employed'), ('retired', 'Retired')], help_text='Employment status', max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='debt_management_bankruptcy',
            field=models.BooleanField(blank=True, help_text='Are you or a partner currently under a Debt Management Plan or Bankruptcy?', null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='government_grants_aware',
            field=models.BooleanField(blank=True, help_text='Are you aware there are no government grants for solar?', null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='assessment_date_preference',
            field=models.DateField(blank=True, help_text='Date preference for assessment', null=True),
        ),
        migrations.AddField(
            model_name='lead',
            name='assessment_time_preference',
            field=models.TimeField(blank=True, help_text='Time preference for assessment', null=True),
        ),
    ]

