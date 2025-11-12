# Generated manually

from django.db import migrations, models


def populate_assigned_agent_name(apps, schema_editor):
    """Populate assigned_agent_name for existing leads"""
    Lead = apps.get_model('leads', 'Lead')
    User = apps.get_model('accounts', 'User')
    
    for lead in Lead.objects.filter(assigned_agent__isnull=False).select_related('assigned_agent'):
        if lead.assigned_agent:
            # Build full name from first_name and last_name fields
            # AbstractUser has get_full_name() but we need to access fields directly in migrations
            agent = lead.assigned_agent
            first_name = getattr(agent, 'first_name', '') or ''
            last_name = getattr(agent, 'last_name', '') or ''
            
            if first_name or last_name:
                full_name = f"{first_name} {last_name}".strip()
                lead.assigned_agent_name = full_name if full_name else agent.username
            else:
                lead.assigned_agent_name = agent.username
            
            lead.save(update_fields=['assigned_agent_name'])


def reverse_populate_assigned_agent_name(apps, schema_editor):
    """Reverse migration - clear assigned_agent_name"""
    Lead = apps.get_model('leads', 'Lead')
    Lead.objects.all().update(assigned_agent_name=None)


class Migration(migrations.Migration):

    dependencies = [
        ('leads', '0024_make_assigned_agent_nullable'),
    ]

    operations = [
        migrations.AddField(
            model_name='lead',
            name='assigned_agent_name',
            field=models.CharField(blank=True, help_text='Name of the assigned agent (preserved even if agent is deleted)', max_length=255, null=True),
        ),
        migrations.RunPython(
            populate_assigned_agent_name,
            reverse_code=reverse_populate_assigned_agent_name,
        ),
    ]

