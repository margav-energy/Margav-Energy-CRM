#!/usr/bin/env python3
"""
Management command for soft delete operations
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from leads.models import Lead, Callback
from leads.soft_delete import SoftDeleteCommand


class Command(SoftDeleteCommand):
    help = 'Manage soft deleted objects with 30-day retention'
    
    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            '--stats',
            action='store_true',
            help='Show statistics about soft deleted objects'
        )
        parser.add_argument(
            '--force-cleanup',
            action='store_true',
            help='Force cleanup of all soft deleted objects (bypass 30-day rule)'
        )
    
    def handle(self, *args, **options):
        if options['stats']:
            self.show_stats()
        elif options['force_cleanup']:
            self.force_cleanup()
        else:
            super().handle(*args, **options)
    
    def show_stats(self):
        """Show statistics about soft deleted objects"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Get counts
        total_leads = Lead.objects.count()
        deleted_leads = Lead.objects.only_deleted().count()
        expired_leads = Lead.objects.only_deleted().filter(
            deleted_at__lt=timezone.now() - timedelta(days=30)
        ).count()
        
        total_callbacks = Callback.objects.count()
        deleted_callbacks = Callback.objects.only_deleted().count()
        expired_callbacks = Callback.objects.only_deleted().filter(
            deleted_at__lt=timezone.now() - timedelta(days=30)
        ).count()
        
        self.stdout.write("Soft Delete Statistics")
        self.stdout.write("=" * 50)
        self.stdout.write(f"Leads:")
        self.stdout.write(f"  - Total: {total_leads}")
        self.stdout.write(f"  - Deleted: {deleted_leads}")
        self.stdout.write(f"  - Expired (ready for cleanup): {expired_leads}")
        self.stdout.write(f"")
        self.stdout.write(f"Callbacks:")
        self.stdout.write(f"  - Total: {total_callbacks}")
        self.stdout.write(f"  - Deleted: {deleted_callbacks}")
        self.stdout.write(f"  - Expired (ready for cleanup): {expired_callbacks}")
        
        # Show recent deletions
        recent_deletions = Lead.objects.only_deleted().order_by('-deleted_at')[:5]
        if recent_deletions:
            self.stdout.write(f"\nRecent Lead Deletions:")
            for lead in recent_deletions:
                self.stdout.write(f"  - {lead.full_name} (deleted: {lead.deleted_at})")
    
    def force_cleanup(self):
        """Force cleanup of all soft deleted objects"""
        self.stdout.write(
            self.style.WARNING('Force cleanup will permanently delete ALL soft deleted objects!')
        )
        
        # Get counts before cleanup
        deleted_leads = Lead.objects.only_deleted().count()
        deleted_callbacks = Callback.objects.only_deleted().count()
        
        if deleted_leads == 0 and deleted_callbacks == 0:
            self.stdout.write("No soft deleted objects found.")
            return
        
        # Confirm with user
        confirm = input(f"Are you sure? This will permanently delete {deleted_leads} leads and {deleted_callbacks} callbacks. Type 'yes' to confirm: ")
        
        if confirm.lower() == 'yes':
            # Delete all soft deleted objects
            Lead.objects.only_deleted().delete()
            Callback.objects.only_deleted().delete()
            
            self.stdout.write(
                self.style.SUCCESS(f'Force cleanup completed: {deleted_leads} leads and {deleted_callbacks} callbacks permanently deleted.')
            )
        else:
            self.stdout.write("Force cleanup cancelled.")
