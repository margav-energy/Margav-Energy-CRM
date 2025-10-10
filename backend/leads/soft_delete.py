"""
Soft Delete System for Django Models
Provides a safe deletion mechanism with 30-day retention period
"""

from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.core.management.base import BaseCommand
import logging

logger = logging.getLogger(__name__)


class SoftDeleteManager(models.Manager):
    """
    Manager that only returns non-deleted objects by default
    """
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    
    def with_deleted(self):
        """Return all objects including deleted ones"""
        return super().get_queryset()
    
    def only_deleted(self):
        """Return only deleted objects"""
        return super().get_queryset().filter(is_deleted=True)


class SoftDeleteModel(models.Model):
    """
    Abstract base model that provides soft delete functionality
    """
    is_deleted = models.BooleanField(default=False, help_text='Whether this object has been soft deleted')
    deleted_at = models.DateTimeField(null=True, blank=True, help_text='When this object was soft deleted')
    deleted_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deleted_%(class)s',
        help_text='User who deleted this object'
    )
    deletion_reason = models.TextField(
        blank=True,
        null=True,
        help_text='Reason for deletion'
    )
    
    # Managers
    objects = SoftDeleteManager()
    all_objects = models.Manager()  # Access to all objects including deleted
    
    class Meta:
        abstract = True
    
    def soft_delete(self, deleted_by=None, reason=None):
        """
        Soft delete this object
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by
        self.deletion_reason = reason
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'deletion_reason'])
        
        logger.info(f"Soft deleted {self.__class__.__name__} {self.pk} by {deleted_by}")
    
    def restore(self, restored_by=None):
        """
        Restore this soft deleted object
        """
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.deletion_reason = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'deletion_reason'])
        
        logger.info(f"Restored {self.__class__.__name__} {self.pk} by {restored_by}")
    
    def is_expired(self):
        """
        Check if this deleted object has expired (30+ days old)
        """
        if not self.is_deleted or not self.deleted_at:
            return False
        
        expiration_date = self.deleted_at + timedelta(days=30)
        return timezone.now() > expiration_date
    
    def hard_delete(self):
        """
        Permanently delete this object (use with caution)
        """
        logger.warning(f"Hard deleting {self.__class__.__name__} {self.pk}")
        super().delete()
    
    def delete(self, using=None, keep_parents=False):
        """
        Override delete to use soft delete by default
        """
        self.soft_delete()
    
    @classmethod
    def cleanup_expired(cls):
        """
        Permanently delete objects that have been soft deleted for 30+ days
        """
        expired_objects = cls.objects.only_deleted().filter(
            deleted_at__lt=timezone.now() - timedelta(days=30)
        )
        
        count = expired_objects.count()
        if count > 0:
            logger.info(f"Cleaning up {count} expired {cls.__name__} objects")
            expired_objects.delete()
            return count
        return 0


class SoftDeleteCommand(BaseCommand):
    """
    Base command for soft delete operations
    """
    help = 'Manage soft deleted objects'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--cleanup',
            action='store_true',
            help='Permanently delete objects that have been soft deleted for 30+ days'
        )
        parser.add_argument(
            '--list-deleted',
            action='store_true',
            help='List all soft deleted objects'
        )
        parser.add_argument(
            '--restore',
            type=int,
            help='Restore a specific object by ID'
        )
        parser.add_argument(
            '--model',
            type=str,
            help='Specify which model to operate on'
        )
    
    def handle(self, *args, **options):
        if options['cleanup']:
            self.cleanup_expired_objects()
        elif options['list_deleted']:
            self.list_deleted_objects()
        elif options['restore']:
            self.restore_object(options['restore'])
        else:
            self.stdout.write(self.style.ERROR('Please specify an action: --cleanup, --list-deleted, or --restore'))
    
    def cleanup_expired_objects(self):
        """Clean up expired soft deleted objects"""
        from leads.models import Lead, Callback
        
        total_cleaned = 0
        
        # Clean up expired leads
        leads_cleaned = Lead.cleanup_expired()
        total_cleaned += leads_cleaned
        self.stdout.write(f"Cleaned up {leads_cleaned} expired leads")
        
        # Clean up expired callbacks
        callbacks_cleaned = Callback.cleanup_expired()
        total_cleaned += callbacks_cleaned
        self.stdout.write(f"Cleaned up {callbacks_cleaned} expired callbacks")
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully cleaned up {total_cleaned} expired objects')
        )
    
    def list_deleted_objects(self):
        """List all soft deleted objects"""
        from leads.models import Lead, Callback
        
        self.stdout.write("Soft Deleted Objects:")
        self.stdout.write("=" * 50)
        
        # List deleted leads
        deleted_leads = Lead.objects.only_deleted()
        self.stdout.write(f"Deleted Leads ({deleted_leads.count()}):")
        for lead in deleted_leads[:10]:  # Show first 10
            self.stdout.write(f"  - {lead.full_name} (deleted: {lead.deleted_at})")
        
        # List deleted callbacks
        deleted_callbacks = Callback.objects.only_deleted()
        self.stdout.write(f"Deleted Callbacks ({deleted_callbacks.count()}):")
        for callback in deleted_callbacks[:10]:  # Show first 10
            self.stdout.write(f"  - {callback.lead.full_name} (deleted: {callback.deleted_at})")
    
    def restore_object(self, object_id):
        """Restore a specific object"""
        from leads.models import Lead, Callback
        
        # Try to find and restore the object
        for model in [Lead, Callback]:
            try:
                obj = model.objects.only_deleted().get(pk=object_id)
                obj.restore()
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully restored {model.__name__} {object_id}')
                )
                return
            except model.DoesNotExist:
                continue
        
        self.stdout.write(
            self.style.ERROR(f'Object with ID {object_id} not found in deleted objects')
        )
