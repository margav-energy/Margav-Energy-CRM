"""
Admin interface for managing soft deleted objects
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import path, reverse
from django.shortcuts import render, redirect
from django.contrib import messages
from django.utils import timezone
from datetime import timedelta
from .models import Lead, Callback
from .soft_delete import SoftDeleteModel


class SoftDeleteAdminMixin:
    """
    Mixin for admin classes to handle soft delete functionality
    """
    def get_queryset(self, request):
        """Show only non-deleted objects by default"""
        return self.model.objects
    
    def soft_delete_view(self, request, object_id):
        """Soft delete an object"""
        try:
            obj = self.model.objects.get(pk=object_id)
            obj.soft_delete(deleted_by=request.user, reason="Deleted via admin")
            messages.success(request, f'{self.model.__name__} "{obj}" has been soft deleted.')
        except self.model.DoesNotExist:
            messages.error(request, f'{self.model.__name__} not found.')
        
        return redirect(request.META.get('HTTP_REFERER', reverse('admin:leads_lead_changelist')))
    
    def restore_view(self, request, object_id):
        """Restore a soft deleted object"""
        try:
            obj = self.model.objects.only_deleted().get(pk=object_id)
            obj.restore(restored_by=request.user)
            messages.success(request, f'{self.model.__name__} "{obj}" has been restored.')
        except self.model.DoesNotExist:
            messages.error(request, f'Deleted {self.model.__name__} not found.')
        
        return redirect(request.META.get('HTTP_REFERER', reverse('admin:leads_lead_changelist')))
    
    def delete_forever_view(self, request, object_id):
        """Permanently delete an object (hard delete)"""
        try:
            obj = self.model.objects.only_deleted().get(pk=object_id)
            obj_name = str(obj)
            obj.hard_delete()
            messages.warning(request, f'{self.model.__name__} "{obj_name}" has been permanently deleted. This action cannot be undone.')
        except self.model.DoesNotExist:
            messages.error(request, f'Deleted {self.model.__name__} not found.')
        
        return redirect(request.META.get('HTTP_REFERER', reverse('admin:leads_lead_changelist')))
    
    def get_urls(self):
        """Add custom URLs for soft delete operations"""
        urls = super().get_urls()
        custom_urls = [
            path('<int:object_id>/soft-delete/', self.admin_site.admin_view(self.soft_delete_view), name=f'{self.model._meta.app_label}_{self.model._meta.model_name}_soft_delete'),
            path('<int:object_id>/restore/', self.admin_site.admin_view(self.restore_view), name=f'{self.model._meta.app_label}_{self.model._meta.model_name}_restore'),
            path('<int:object_id>/delete-forever/', self.admin_site.admin_view(self.delete_forever_view), name=f'{self.model._meta.app_label}_{self.model._meta.model_name}_delete_forever'),
        ]
        return custom_urls + urls


@admin.register(Lead)
class LeadAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    list_display = ['full_name', 'phone', 'status', 'assigned_agent', 'created_at', 'soft_delete_status']
    list_filter = ['status', 'is_deleted', 'assigned_agent', 'created_at']
    search_fields = ['full_name', 'phone', 'email']
    readonly_fields = ['deleted_at', 'deleted_by', 'deletion_reason']
    
    def soft_delete_status(self, obj):
        """Show soft delete status in admin list"""
        if obj.is_deleted:
            days_ago = (timezone.now() - obj.deleted_at).days if obj.deleted_at else 0
            if days_ago >= 30:
                return format_html('<span style="color: red;">Deleted {} days ago (EXPIRED)</span>', days_ago)
            else:
                return format_html('<span style="color: orange;">Deleted {} days ago</span>', days_ago)
        return format_html('<span style="color: green;">Active</span>')
    
    soft_delete_status.short_description = 'Status'
    
    def get_queryset(self, request):
        """Show all objects including deleted ones"""
        return self.model.all_objects.all()
    
    def delete_model(self, request, obj):
        """Override delete to use soft delete"""
        obj.soft_delete(deleted_by=request.user, reason="Deleted via admin")
    
    def delete_queryset(self, request, queryset):
        """Override bulk delete to use soft delete"""
        for obj in queryset:
            obj.soft_delete(deleted_by=request.user, reason="Bulk deleted via admin")


@admin.register(Callback)
class CallbackAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    list_display = ['lead', 'scheduled_time', 'status', 'created_at', 'soft_delete_status']
    list_filter = ['status', 'is_deleted', 'created_at']
    search_fields = ['lead__full_name', 'notes']
    readonly_fields = ['deleted_at', 'deleted_by', 'deletion_reason']
    
    def soft_delete_status(self, obj):
        """Show soft delete status in admin list"""
        if obj.is_deleted:
            days_ago = (timezone.now() - obj.deleted_at).days if obj.deleted_at else 0
            if days_ago >= 30:
                return format_html('<span style="color: red;">Deleted {} days ago (EXPIRED)</span>', days_ago)
            else:
                return format_html('<span style="color: orange;">Deleted {} days ago</span>', days_ago)
        return format_html('<span style="color: green;">Active</span>')
    
    soft_delete_status.short_description = 'Status'
    
    def get_queryset(self, request):
        """Show all objects including deleted ones"""
        return self.model.all_objects.all()
    
    def delete_model(self, request, obj):
        """Override delete to use soft delete"""
        obj.soft_delete(deleted_by=request.user, reason="Deleted via admin")
    
    def delete_queryset(self, request, queryset):
        """Override bulk delete to use soft delete"""
        for obj in queryset:
            obj.soft_delete(deleted_by=request.user, reason="Bulk deleted via admin")


class SoftDeleteManagementAdmin(admin.ModelAdmin):
    """
    Admin interface for managing soft delete operations
    """
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('soft-delete-management/', self.admin_site.admin_view(self.soft_delete_management_view), name='soft_delete_management'),
        ]
        return custom_urls + urls
    
    def soft_delete_management_view(self, request):
        """View for managing soft delete operations"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Get statistics
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
        
        # Get recent deletions
        recent_deleted_leads = Lead.objects.only_deleted().order_by('-deleted_at')[:10]
        recent_deleted_callbacks = Callback.objects.only_deleted().order_by('-deleted_at')[:10]
        
        context = {
            'title': 'Soft Delete Management',
            'total_leads': total_leads,
            'deleted_leads': deleted_leads,
            'expired_leads': expired_leads,
            'total_callbacks': total_callbacks,
            'deleted_callbacks': deleted_callbacks,
            'expired_callbacks': expired_callbacks,
            'recent_deleted_leads': recent_deleted_leads,
            'recent_deleted_callbacks': recent_deleted_callbacks,
        }
        
        return render(request, 'admin/soft_delete_management.html', context)
    
    def changelist_view(self, request, extra_context=None):
        """Add soft delete management link to changelist"""
        extra_context = extra_context or {}
        extra_context['show_soft_delete_management'] = True
        return super().changelist_view(request, extra_context)
