from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from leads.models import Lead, Dialer
from datetime import datetime, timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Create comprehensive demo data for CRM presentation'

    def handle(self, *args, **options):
        # Create or get users
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@margavenergy.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'is_superuser': True,
                'is_staff': True,
            }
        )
        admin_user.set_password('123')
        admin_user.save()

        # Create agents
        agents = []
        agent_data = [
            {'username': 'agent1', 'first_name': 'John', 'last_name': 'Smith', 'email': 'john@margavenergy.com'},
            {'username': 'agent2', 'first_name': 'Sarah', 'last_name': 'Johnson', 'email': 'sarah@margavenergy.com'},
            {'username': 'agent3', 'first_name': 'Mike', 'last_name': 'Davis', 'email': 'mike@margavenergy.com'},
        ]
        
        for agent_info in agent_data:
            agent, _ = User.objects.get_or_create(
                username=agent_info['username'],
                defaults={
                    'email': agent_info['email'],
                    'first_name': agent_info['first_name'],
                    'last_name': agent_info['last_name'],
                    'role': 'agent',
                }
            )
            agent.set_password('123')
            agent.save()
            agents.append(agent)

        # Create Kelly (qualifier)
        kelly, _ = User.objects.get_or_create(
            username='kelly',
            defaults={
                'email': 'kelly@margavenergy.com',
                'first_name': 'Kelly',
                'last_name': 'Wilson',
                'role': 'qualifier',
            }
        )
        kelly.set_password('123')
        kelly.save()

        # Create field sales reps
        sales_reps = []
        salesrep_data = [
            {'username': 'salesrep1', 'first_name': 'Tom', 'last_name': 'Brown', 'email': 'tom@margavenergy.com'},
            {'username': 'salesrep2', 'first_name': 'Lisa', 'last_name': 'Garcia', 'email': 'lisa@margavenergy.com'},
        ]
        
        for rep_info in salesrep_data:
            rep, _ = User.objects.get_or_create(
                username=rep_info['username'],
                defaults={
                    'email': rep_info['email'],
                    'first_name': rep_info['first_name'],
                    'last_name': rep_info['last_name'],
                    'role': 'salesrep',
                }
            )
            rep.set_password('123')
            rep.save()
            sales_reps.append(rep)

        # Create dialer and activate it
        dialer, _ = Dialer.objects.get_or_create(
            defaults={'is_active': True, 'created_by': admin_user}
        )
        dialer.is_active = True
        dialer.save()

        # Sample lead data
        lead_data = [
            # Cold Call Leads
            {'name': 'Robert Martinez', 'phone': '+1-555-0101', 'email': 'robert.martinez@email.com', 'status': 'cold_call'},
            {'name': 'Jennifer Lee', 'phone': '+1-555-0102', 'email': 'jennifer.lee@email.com', 'status': 'cold_call'},
            {'name': 'David Thompson', 'phone': '+1-555-0103', 'email': 'david.thompson@email.com', 'status': 'cold_call'},
            {'name': 'Maria Rodriguez', 'phone': '+1-555-0104', 'email': 'maria.rodriguez@email.com', 'status': 'cold_call'},
            {'name': 'James Wilson', 'phone': '+1-555-0105', 'email': 'james.wilson@email.com', 'status': 'cold_call'},
            
            # Interested leads (sent to Kelly)
            {'name': 'Emily Chen', 'phone': '+1-555-0201', 'email': 'emily.chen@email.com', 'status': 'sent_to_kelly', 'notes': 'Interested in residential solar panels for new home construction.'},
            {'name': 'Michael Anderson', 'phone': '+1-555-0202', 'email': 'michael.anderson@email.com', 'status': 'sent_to_kelly', 'notes': 'Looking to reduce electricity bills, owns 2500 sq ft home.'},
            {'name': 'Amanda Taylor', 'phone': '+1-555-0203', 'email': 'amanda.taylor@email.com', 'status': 'sent_to_kelly', 'notes': 'Commercial property owner interested in solar for warehouse.'},
            {'name': 'Christopher Moore', 'phone': '+1-555-0204', 'email': 'christopher.moore@email.com', 'status': 'sent_to_kelly', 'notes': 'Homeowner with high electricity usage, very interested.'},
            
            # Qualified leads
            {'name': 'Jessica White', 'phone': '+1-555-0301', 'email': 'jessica.white@email.com', 'status': 'qualified', 'notes': 'Qualified for residential installation. Budget approved.'},
            {'name': 'Daniel Jackson', 'phone': '+1-555-0302', 'email': 'daniel.jackson@email.com', 'status': 'qualified', 'notes': 'Commercial lead qualified. Ready for site assessment.'},
            
            # Appointments set
            {'name': 'Ashley Harris', 'phone': '+1-555-0401', 'email': 'ashley.harris@email.com', 'status': 'appointment_set', 'appointment_date': datetime.now() + timedelta(days=2), 'notes': 'Site assessment scheduled for residential installation.'},
            {'name': 'Ryan Clark', 'phone': '+1-555-0402', 'email': 'ryan.clark@email.com', 'status': 'appointment_set', 'appointment_date': datetime.now() + timedelta(days=3), 'notes': 'Commercial property evaluation scheduled.'},
            {'name': 'Nicole Lewis', 'phone': '+1-555-0403', 'email': 'nicole.lewis@email.com', 'status': 'appointment_set', 'appointment_date': datetime.now() + timedelta(days=5), 'notes': 'Home consultation for solar panel installation.'},
            
            # Completed appointments
            {'name': 'Kevin Walker', 'phone': '+1-555-0501', 'email': 'kevin.walker@email.com', 'status': 'appointment_completed', 'appointment_date': datetime.now() - timedelta(days=1), 'notes': 'Site assessment completed. Proposal sent.'},
            {'name': 'Rachel Hall', 'phone': '+1-555-0502', 'email': 'rachel.hall@email.com', 'status': 'appointment_completed', 'appointment_date': datetime.now() - timedelta(days=2), 'notes': 'Commercial evaluation completed. Awaiting decision.'},
            
            # Sales made
            {'name': 'Brandon Young', 'phone': '+1-555-0601', 'email': 'brandon.young@email.com', 'status': 'sale_made', 'appointment_date': datetime.now() - timedelta(days=3), 'sale_amount': 25000.00, 'notes': 'Residential solar system sold. Installation scheduled.'},
            {'name': 'Stephanie King', 'phone': '+1-555-0602', 'email': 'stephanie.king@email.com', 'status': 'sale_made', 'appointment_date': datetime.now() - timedelta(days=4), 'sale_amount': 45000.00, 'notes': 'Commercial solar installation sold. Project in progress.'},
            
            # Sales lost
            {'name': 'Tyler Wright', 'phone': '+1-555-0701', 'email': 'tyler.wright@email.com', 'status': 'sale_lost', 'appointment_date': datetime.now() - timedelta(days=5), 'notes': 'Customer decided to go with competitor due to pricing.'},
            
            # Not interested with dispositions
            {'name': 'Megan Lopez', 'phone': '+1-555-0801', 'email': 'megan.lopez@email.com', 'status': 'not_interested', 'disposition': 'not_interested', 'notes': 'Not interested in solar at this time.'},
            {'name': 'Justin Hill', 'phone': '+1-555-0802', 'email': 'justin.hill@email.com', 'status': 'tenant', 'disposition': 'tenant', 'notes': 'Rents property, not homeowner.'},
            {'name': 'Samantha Green', 'phone': '+1-555-0803', 'email': 'samantha.green@email.com', 'status': 'other_disposition', 'disposition': 'wrong_number', 'notes': 'Wrong number, not the person we were trying to reach.'},
        ]

        created_count = 0
        for lead_info in lead_data:
            # Assign to random agent
            assigned_agent = random.choice(agents)
            
            # Assign field sales rep for appointments and beyond
            field_sales_rep = None
            if lead_info['status'] in ['appointment_set', 'appointment_completed', 'sale_made', 'sale_lost']:
                field_sales_rep = random.choice(sales_reps)
            
            lead, created = Lead.objects.get_or_create(
                phone=lead_info['phone'],
                defaults={
                    'full_name': lead_info['name'],
                    'email': lead_info['email'],
                    'status': lead_info['status'],
                    'disposition': lead_info.get('disposition'),
                    'assigned_agent': assigned_agent,
                    'field_sales_rep': field_sales_rep,
                    'notes': lead_info.get('notes', ''),
                    'appointment_date': lead_info.get('appointment_date'),
                    'sale_amount': lead_info.get('sale_amount'),
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created lead: {lead.full_name} ({lead.status})')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Created {created_count} demo leads!')
        )
        
        # Display login credentials
        self.stdout.write(
            self.style.SUCCESS('\n=== DEMO LOGIN CREDENTIALS ===')
        )
        self.stdout.write('Admin: admin / 123')
        self.stdout.write('Agent 1: agent1 / 123')
        self.stdout.write('Agent 2: agent2 / 123') 
        self.stdout.write('Agent 3: agent3 / 123')
        self.stdout.write('Kelly (Qualifier): kelly / 123')
        self.stdout.write('Sales Rep 1: salesrep1 / 123')
        self.stdout.write('Sales Rep 2: salesrep2 / 123')
        self.stdout.write('\nDialer is ACTIVE - agents will receive cold call leads!')
