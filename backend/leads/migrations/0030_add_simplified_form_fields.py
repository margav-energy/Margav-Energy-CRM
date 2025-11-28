# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('leads', '0029_add_qualifier_notes'),
    ]

    operations = [
        migrations.AddField(
            model_name='fieldsubmission',
            name='age_range',
            field=models.CharField(blank=True, help_text='Age range (18-74/outside_range)', max_length=20),
        ),
        migrations.AddField(
            model_name='fieldsubmission',
            name='electric_bill',
            field=models.CharField(blank=True, help_text='Electric bill amount', max_length=50),
        ),
        migrations.AlterField(
            model_name='fieldsubmission',
            name='is_decision_maker',
            field=models.CharField(blank=True, help_text='Is customer the decision maker? (yes/no/partner)', max_length=20),
        ),
    ]

