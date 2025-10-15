from django.core.management.base import BaseCommand
from django.core.management import call_command
import json
import os

class Command(BaseCommand):
    help = 'Import data from JSON file'

    def add_arguments(self, parser):
        parser.add_argument('--file', default='data_export.json', help='JSON file to import')
        parser.add_argument('--skip-existing', action='store_true', help='Skip existing records')

    def handle(self, *args, **options):
        file_path = options['file']
        skip_existing = options['skip_existing']
        
        if not os.path.exists(file_path):
            self.stdout.write(
                self.style.ERROR(f'File {file_path} not found')
            )
            return

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.stdout.write(f'Found {len(data)} records to import')
            
            # Count by model type
            from collections import Counter
            model_counts = Counter([item['model'] for item in data])
            
            self.stdout.write('Models to import:')
            for model, count in model_counts.items():
                self.stdout.write(f'  {model}: {count} records')
            
            # Import the data
            self.stdout.write('Starting data import...')
            call_command('loaddata', file_path, verbosity=1)
            
            self.stdout.write(
                self.style.SUCCESS('Data import completed successfully!')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error importing data: {str(e)}')
            )
