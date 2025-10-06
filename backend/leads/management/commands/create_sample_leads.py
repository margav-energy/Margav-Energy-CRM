from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from leads.models import Lead
from datetime import datetime, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample leads for testing'

    def handle(self, *args, **options):
        # Get agents for assignment
        agents = User.objects.filter(role='agent')
        if not agents.exists():
            self.stdout.write(
                self.style.ERROR('No agents found. Please create users first using create_users command.')
            )
            return

        # Sample leads data
        leads_data = [
            {
                'full_name': 'Alice Johnson',
                'phone': '+1234567890',
                'email': 'alice.johnson@email.com',
                'status': 'interested',
                'notes': 'Interested in solar panels for residential use.',
            },
            {
                'full_name': 'Bob Smith',
                'phone': '+1234567891',
                'email': 'bob.smith@email.com',
                'status': 'interested',
                'notes': 'Looking for energy efficiency solutions.',
            },
            {
                'full_name': 'Carol Davis',
                'phone': '+1234567892',
                'email': 'carol.davis@email.com',
                'status': 'qualified',
                'notes': 'Qualified lead, ready for appointment.',
                'appointment_date': datetime.now() + timedelta(days=3),
            },
            {
                'full_name': 'David Wilson',
                'phone': '+1234567893',
                'email': 'david.wilson@email.com',
                'status': 'appointment_set',
                'notes': 'Appointment scheduled for next week.',
                'appointment_date': datetime.now() + timedelta(days=7),
            },
            {
                'full_name': 'Eva Brown',
                'phone': '+1234567894',
                'email': 'eva.brown@email.com',
                'status': 'not_interested',
                'notes': 'Not interested at this time.',
            },
            {
                'full_name': 'Frank Miller',
                'phone': '+1234567895',
                'email': 'frank.miller@email.com',
                'status': 'interested',
                'notes': 'Interested in commercial solar solutions.',
            },
            {
                'full_name': 'Grace Lee',
                'phone': '+1234567896',
                'email': 'grace.lee@email.com',
                'status': 'qualified',
                'notes': 'Qualified for residential installation.',
            },
            {
                'full_name': 'Henry Taylor',
                'phone': '+1234567897',
                'email': 'henry.taylor@email.com',
                'status': 'appointment_set',
                'notes': 'Meeting scheduled for property assessment.',
                'appointment_date': datetime.now() + timedelta(days=5),
            },
        ]

        created_count = 0
        for lead_data in leads_data:
            # Assign to a random agent
            assigned_agent = agents[created_count % agents.count()]
            lead_data['assigned_agent'] = assigned_agent
            
            lead, created = Lead.objects.get_or_create(
                phone=lead_data['phone'],
                defaults=lead_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created lead: {lead.full_name} (assigned to {assigned_agent.username})')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Lead already exists: {lead.full_name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Created {created_count} new leads!')
        )
