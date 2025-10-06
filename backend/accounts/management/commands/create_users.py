from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample users for testing'

    def handle(self, *args, **options):
        # Create admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@crm.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'is_superuser': True,
                'is_staff': True,
            }
        )
        if created:
            admin_user.set_password('123')
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Created admin user: {admin_user.username}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Admin user already exists: {admin_user.username}')
            )

        # Create agents
        agents_data = [
            {'username': 'agent1', 'first_name': 'John', 'last_name': 'Agent', 'email': 'agent1@crm.com'},
            {'username': 'agent2', 'first_name': 'Jane', 'last_name': 'Agent', 'email': 'agent2@crm.com'},
            {'username': 'agent3', 'first_name': 'Mike', 'last_name': 'Agent', 'email': 'agent3@crm.com'},
        ]
        
        for agent_data in agents_data:
            agent, created = User.objects.get_or_create(
                username=agent_data['username'],
                defaults={
                    'email': agent_data['email'],
                    'first_name': agent_data['first_name'],
                    'last_name': agent_data['last_name'],
                    'role': 'agent',
                }
            )
            if created:
                agent.set_password('123')
                agent.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Created agent: {agent.username}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Agent already exists: {agent.username}')
                )

        # Create qualifiers
        qualifiers_data = [
            {'username': 'qualifier1', 'first_name': 'Sarah', 'last_name': 'Qualifier', 'email': 'qualifier1@crm.com'},
            {'username': 'qualifier2', 'first_name': 'David', 'last_name': 'Qualifier', 'email': 'qualifier2@crm.com'},
        ]
        
        for qualifier_data in qualifiers_data:
            qualifier, created = User.objects.get_or_create(
                username=qualifier_data['username'],
                defaults={
                    'email': qualifier_data['email'],
                    'first_name': qualifier_data['first_name'],
                    'last_name': qualifier_data['last_name'],
                    'role': 'qualifier',
                }
            )
            if created:
                qualifier.set_password('123')
                qualifier.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Created qualifier: {qualifier.username}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Qualifier already exists: {qualifier.username}')
                )

        # Create sales reps
        salesreps_data = [
            {'username': 'salesrep1', 'first_name': 'Tom', 'last_name': 'Sales', 'email': 'salesrep1@crm.com'},
            {'username': 'salesrep2', 'first_name': 'Lisa', 'last_name': 'Sales', 'email': 'salesrep2@crm.com'},
        ]
        
        for salesrep_data in salesreps_data:
            salesrep, created = User.objects.get_or_create(
                username=salesrep_data['username'],
                defaults={
                    'email': salesrep_data['email'],
                    'first_name': salesrep_data['first_name'],
                    'last_name': salesrep_data['last_name'],
                    'role': 'salesrep',
                }
            )
            if created:
                salesrep.set_password('123')
                salesrep.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Created sales rep: {salesrep.username}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Sales rep already exists: {salesrep.username}')
                )

        self.stdout.write(
            self.style.SUCCESS('User creation completed!')
        )
