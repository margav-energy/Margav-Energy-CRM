#!/usr/bin/env python3
"""
Scheduled command to clean up expired soft deleted objects
Run this daily via cron or task scheduler
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from leads.models import Lead, Callback
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Clean up expired soft deleted objects (30+ days old)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force cleanup even if objects are not expired'
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        
        self.stdout.write("Starting cleanup of expired soft deleted objects...")
        
        # Clean up expired leads
        leads_cleaned = self.cleanup_leads(dry_run, force)
        
        # Clean up expired callbacks
        callbacks_cleaned = self.cleanup_callbacks(dry_run, force)
        
        total_cleaned = leads_cleaned + callbacks_cleaned
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would clean up {total_cleaned} objects')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully cleaned up {total_cleaned} expired objects')
            )
            
            # Log the cleanup
            logger.info(f"Cleanup completed: {leads_cleaned} leads, {callbacks_cleaned} callbacks")
    
    def cleanup_leads(self, dry_run=False, force=False):
        """Clean up expired leads"""
        from datetime import timedelta
        
        if force:
            expired_leads = Lead.objects.only_deleted()
        else:
            expired_leads = Lead.objects.only_deleted().filter(
                deleted_at__lt=timezone.now() - timedelta(days=30)
            )
        
        count = expired_leads.count()
        
        if count > 0:
            if dry_run:
                self.stdout.write(f"Would delete {count} expired leads:")
                for lead in expired_leads[:5]:  # Show first 5
                    self.stdout.write(f"  - {lead.full_name} (deleted: {lead.deleted_at})")
                if count > 5:
                    self.stdout.write(f"  ... and {count - 5} more")
            else:
                # Log before deletion
                for lead in expired_leads:
                    logger.info(f"Permanently deleting lead {lead.pk}: {lead.full_name}")
                
                expired_leads.delete()
                self.stdout.write(f"Deleted {count} expired leads")
        
        return count
    
    def cleanup_callbacks(self, dry_run=False, force=False):
        """Clean up expired callbacks"""
        from datetime import timedelta
        
        if force:
            expired_callbacks = Callback.objects.only_deleted()
        else:
            expired_callbacks = Callback.objects.only_deleted().filter(
                deleted_at__lt=timezone.now() - timedelta(days=30)
            )
        
        count = expired_callbacks.count()
        
        if count > 0:
            if dry_run:
                self.stdout.write(f"Would delete {count} expired callbacks:")
                for callback in expired_callbacks[:5]:  # Show first 5
                    self.stdout.write(f"  - {callback.lead.full_name} (deleted: {callback.deleted_at})")
                if count > 5:
                    self.stdout.write(f"  ... and {count - 5} more")
            else:
                # Log before deletion
                for callback in expired_callbacks:
                    logger.info(f"Permanently deleting callback {callback.pk}: {callback.lead.full_name}")
                
                expired_callbacks.delete()
                self.stdout.write(f"Deleted {count} expired callbacks")
        
        return count
