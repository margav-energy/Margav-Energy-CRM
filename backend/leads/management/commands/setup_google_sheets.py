"""
Django management command to set up Google Sheets integration
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from leads.google_sheets_service import google_sheets_service
import os

class Command(BaseCommand):
    help = 'Set up Google Sheets integration for lead backup'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-spreadsheet',
            action='store_true',
            help='Create a new Google Spreadsheet for leads',
        )
        parser.add_argument(
            '--spreadsheet-id',
            type=str,
            help='Google Spreadsheet ID to use (if not creating new)',
        )
        parser.add_argument(
            '--worksheet-name',
            type=str,
            default='Leads',
            help='Name of the worksheet to use (default: Leads)',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Setting up Google Sheets integration...')
        )

        # Check if credentials are configured
        if not all([
            getattr(settings, 'GOOGLE_CLIENT_ID', ''),
            getattr(settings, 'GOOGLE_CLIENT_SECRET', ''),
            getattr(settings, 'GOOGLE_REFRESH_TOKEN', '')
        ]):
            self.stdout.write(
                self.style.ERROR(
                    'Google OAuth credentials not configured. '
                    'Please run setup_google_calendar first.'
                )
            )
            return

        # Create spreadsheet if requested
        if options['create_spreadsheet']:
            self.stdout.write('Creating new Google Spreadsheet...')
            spreadsheet_id = google_sheets_service.create_spreadsheet()
            
            if spreadsheet_id:
                self.stdout.write(
                    self.style.SUCCESS(f'Created spreadsheet: {spreadsheet_id}')
                )
                self.stdout.write(
                    f'Spreadsheet URL: https://docs.google.com/spreadsheets/d/{spreadsheet_id}'
                )
                
                # Update .env file
                self.update_env_file(spreadsheet_id, options['worksheet_name'])
            else:
                self.stdout.write(
                    self.style.ERROR('Failed to create spreadsheet')
                )
                return

        # Use provided spreadsheet ID
        elif options['spreadsheet_id']:
            spreadsheet_id = options['spreadsheet_id']
            self.stdout.write(f'Using existing spreadsheet: {spreadsheet_id}')
            self.update_env_file(spreadsheet_id, options['worksheet_name'])

        else:
            self.stdout.write(
                self.style.ERROR(
                    'Please provide either --create-spreadsheet or --spreadsheet-id'
                )
            )
            return

        # Test the connection
        self.stdout.write('Testing Google Sheets connection...')
        result = google_sheets_service.sync_all_leads_to_sheets()
        
        if result['success'] > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully synced {result["success"]} leads to Google Sheets'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING('No leads found to sync')
            )

        self.stdout.write(
            self.style.SUCCESS('Google Sheets integration setup complete!')
        )

    def update_env_file(self, spreadsheet_id, worksheet_name):
        """Update .env file with spreadsheet configuration"""
        env_file = os.path.join(settings.BASE_DIR, '.env')
        
        # Read existing .env file
        env_content = []
        if os.path.exists(env_file):
            with open(env_file, 'r') as f:
                env_content = f.readlines()
        
        # Update or add spreadsheet configuration
        updated = False
        for i, line in enumerate(env_content):
            if line.startswith('GOOGLE_SHEETS_SPREADSHEET_ID='):
                env_content[i] = f'GOOGLE_SHEETS_SPREADSHEET_ID={spreadsheet_id}\n'
                updated = True
                break
        
        if not updated:
            env_content.append(f'GOOGLE_SHEETS_SPREADSHEET_ID={spreadsheet_id}\n')
        
        # Update worksheet name
        updated = False
        for i, line in enumerate(env_content):
            if line.startswith('GOOGLE_SHEETS_WORKSHEET_NAME='):
                env_content[i] = f'GOOGLE_SHEETS_WORKSHEET_NAME={worksheet_name}\n'
                updated = True
                break
        
        if not updated:
            env_content.append(f'GOOGLE_SHEETS_WORKSHEET_NAME={worksheet_name}\n')
        
        # Write back to .env file
        with open(env_file, 'w') as f:
            f.writelines(env_content)
        
        self.stdout.write(f'Updated .env file with spreadsheet configuration')
