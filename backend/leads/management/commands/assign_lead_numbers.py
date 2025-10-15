from django.core.management.base import BaseCommand
from leads.models import Lead
from django.db import transaction


class Command(BaseCommand):
    help = 'Assign custom lead numbers (ME001, ME002, etc.) to existing leads'

    def add_arguments(self, parser):
        parser.add_argument(
            '--start-from',
            type=int,
            default=1,
            help='Start numbering from this number (default: 1)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )

    def handle(self, *args, **options):
        start_from = options['start_from']
        dry_run = options['dry_run']
        
        # Get all leads ordered by creation date
        leads = Lead.objects.filter(lead_number__isnull=True).order_by('created_at')
        
        if not leads.exists():
            self.stdout.write(
                self.style.WARNING('No leads found without lead numbers.')
            )
            return
        
        self.stdout.write(f'Found {leads.count()} leads without lead numbers.')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN - No changes will be made')
            )
        
        updated_count = 0
        
        with transaction.atomic():
            for i, lead in enumerate(leads, start=start_from):
                lead_number = f"ME{i:03d}"
                
                if dry_run:
                    self.stdout.write(
                        f'Would assign {lead_number} to {lead.full_name} (ID: {lead.id})'
                    )
                else:
                    lead.lead_number = lead_number
                    lead.save(skip_audit=True)  # Skip audit to avoid infinite loops
                    self.stdout.write(
                        f'Assigned {lead_number} to {lead.full_name} (ID: {lead.id})'
                    )
                
                updated_count += 1
        
        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully assigned lead numbers to {updated_count} leads.'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Would assign lead numbers to {updated_count} leads. Run without --dry-run to apply changes.'
                )
            )
