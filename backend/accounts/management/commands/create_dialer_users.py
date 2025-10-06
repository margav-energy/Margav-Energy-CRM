from django.core.management.base import BaseCommand
from accounts.models import User
from leads.models import DialerUserLink
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Create CRM users for dialer users with password 123'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            default='123',
            help='Password to set for all users (default: 123)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating users'
        )

    def handle(self, *args, **options):
        password = options['password']
        dry_run = options['dry_run']
        
        # Dialer users data from the provided list - username matches dialer_user_id
        dialer_users = [
            {'dialer_user_id': '8050', 'full_name': '8050', 'username': '8050'},
            {'dialer_user_id': '8051', 'full_name': '8051', 'username': '8051'},
            {'dialer_user_id': '8052', 'full_name': '8052', 'username': '8052'},
            {'dialer_user_id': '8053', 'full_name': '8053', 'username': '8053'},
            {'dialer_user_id': '8054', 'full_name': '8054', 'username': '8054'},
            {'dialer_user_id': 'admin', 'full_name': 'admin', 'username': 'admin'},
            {'dialer_user_id': 'Andy', 'full_name': 'Andy', 'username': 'Andy'},
            {'dialer_user_id': 'ashley', 'full_name': 'ashley', 'username': 'ashley'},
            {'dialer_user_id': 'CalebG', 'full_name': 'Caleb Galloway', 'username': 'CalebG'},
            {'dialer_user_id': 'DaniC', 'full_name': 'Danielle Crutchley', 'username': 'DaniC'},
            {'dialer_user_id': 'VDCL', 'full_name': 'Inbound No Agent', 'username': 'VDCL'},
            {'dialer_user_id': 'JakeR', 'full_name': 'Jake Rose', 'username': 'JakeR'},
            {'dialer_user_id': 'LeiaG', 'full_name': 'Leia Garbitt', 'username': 'LeiaG'},
            {'dialer_user_id': 'LibbyL', 'full_name': 'Liberty Liddle-Old', 'username': 'LibbyL'},
            {'dialer_user_id': 'VDAD', 'full_name': 'Outbound Auto Dial', 'username': 'VDAD'},
            {'dialer_user_id': 'ImaniU', 'full_name': 'Roheece Imani Hines', 'username': 'ImaniU'},
            {'dialer_user_id': 'training1', 'full_name': 'Training 1', 'username': 'training1'},
            {'dialer_user_id': 'Tyler', 'full_name': 'Tyler Gittoes-Lemm', 'username': 'Tyler'},
        ]

        created_count = 0
        updated_count = 0
        error_count = 0

        self.stdout.write(f"{'DRY RUN: ' if dry_run else ''}Creating dialer users...")
        self.stdout.write(f"Password: {password}")
        self.stdout.write("=" * 50)

        for user_data in dialer_users:
            dialer_user_id = user_data['dialer_user_id']
            full_name = user_data['full_name']
            username = user_data['username']

            try:
                if dry_run:
                    self.stdout.write(f"Would create: {username} (Dialer ID: {dialer_user_id}) - {full_name}")
                    continue

                # Create or get the user
                user, created = User.objects.get_or_create(
                    username=username,
                    defaults={
                        'first_name': full_name.split()[0] if full_name and ' ' in full_name else '',
                        'last_name': ' '.join(full_name.split()[1:]) if full_name and ' ' in full_name else full_name,
                        'email': f"{username}@margavenergy.com",
                        'is_active': True,
                        'is_staff': False,
                        'is_superuser': False,
                        'role': 'agent',  # Set default role as agent
                    }
                )

                if created:
                    user.set_password(password)
                    user.save()
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"✓ Created user: {username} (Dialer ID: {dialer_user_id}) - {full_name}")
                    )
                else:
                    # Update password for existing user
                    user.set_password(password)
                    user.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f"↻ Updated password for existing user: {username} (Dialer ID: {dialer_user_id}) - {full_name}")
                    )

                # Create or update DialerUserLink
                dialer_link, link_created = DialerUserLink.objects.get_or_create(
                    dialer_user_id=dialer_user_id,
                    defaults={'crm_user': user}
                )
                
                if not link_created:
                    # Update existing link if user changed
                    if dialer_link.crm_user != user:
                        dialer_link.crm_user = user
                        dialer_link.save()
                        self.stdout.write(
                            self.style.WARNING(f"↻ Updated DialerUserLink for {dialer_user_id} -> {username}")
                        )

                if link_created:
                    self.stdout.write(
                        self.style.SUCCESS(f"✓ Created DialerUserLink: {dialer_user_id} -> {username}")
                    )

            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f"✗ Error creating {username}: {str(e)}")
                )
                logger.error(f"Error creating user {username}: {str(e)}")

        self.stdout.write("=" * 50)
        if dry_run:
            self.stdout.write(f"DRY RUN: Would create {len(dialer_users)} users")
        else:
            self.stdout.write(f"Summary:")
            self.stdout.write(f"  Created: {created_count}")
            self.stdout.write(f"  Updated: {updated_count}")
            self.stdout.write(f"  Errors: {error_count}")
            self.stdout.write(f"  Total processed: {len(dialer_users)}")

        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(f"\n✓ Successfully processed {len(dialer_users)} dialer users")
            )
            self.stdout.write(f"All users have password: {password}")
            self.stdout.write("You can now log in with any of these usernames and the password.")