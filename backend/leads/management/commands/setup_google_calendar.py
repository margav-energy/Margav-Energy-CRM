"""
Django management command to set up Google Calendar OAuth integration.
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import os
import json

class Command(BaseCommand):
    help = 'Set up Google Calendar OAuth integration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--json-file',
            type=str,
            help='Path to the Google OAuth JSON file (CRM.json)',
            default='CRM.json'
        )

    def handle(self, *args, **options):
        json_file_path = options['json_file']
        
        if not os.path.exists(json_file_path):
            self.stdout.write(
                self.style.ERROR(f'JSON file not found: {json_file_path}')
            )
            return
        
        try:
            # Read the JSON file
            with open(json_file_path, 'r') as f:
                oauth_data = json.load(f)
            
            # Extract OAuth credentials
            web_config = oauth_data.get('web', {})
            client_id = web_config.get('client_id')
            client_secret = web_config.get('client_secret')
            redirect_uris = web_config.get('redirect_uris', [])
            
            if not all([client_id, client_secret, redirect_uris]):
                self.stdout.write(
                    self.style.ERROR('Invalid OAuth JSON file format')
                )
                return
            
            # Update .env file
            env_file_path = os.path.join(settings.BASE_DIR, '.env')
            
            # Read existing .env file
            env_lines = []
            if os.path.exists(env_file_path):
                with open(env_file_path, 'r') as f:
                    env_lines = f.readlines()
            
            # Update or add Google OAuth credentials
            updates = {
                'GOOGLE_CLIENT_ID': client_id,
                'GOOGLE_CLIENT_SECRET': client_secret,
                'GOOGLE_REDIRECT_URI': redirect_uris[0] if redirect_uris else 'http://localhost:8000/api/auth/google/callback'
            }
            
            for key, value in updates.items():
                key_found = False
                for i, line in enumerate(env_lines):
                    if line.startswith(f"{key}="):
                        env_lines[i] = f"{key}={value}\n"
                        key_found = True
                        break
                
                if not key_found:
                    env_lines.append(f"{key}={value}\n")
            
            # Write back to .env file
            with open(env_file_path, 'w') as f:
                f.writelines(env_lines)
            
            self.stdout.write(
                self.style.SUCCESS('Google Calendar OAuth credentials updated successfully!')
            )
            self.stdout.write(f'Client ID: {client_id}')
            self.stdout.write(f'Redirect URI: {redirect_uris[0] if redirect_uris else "Not set"}')
            self.stdout.write('')
            self.stdout.write('Next steps:')
            self.stdout.write('1. Run: python manage.py runserver')
            self.stdout.write('2. Visit: http://localhost:8000/api/auth/google/')
            self.stdout.write('3. Complete the OAuth flow to get your refresh token')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error setting up Google Calendar: {e}')
            )
