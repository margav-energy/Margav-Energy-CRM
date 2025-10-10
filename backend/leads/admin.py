from django.contrib import admin
from django.utils.html import format_html
from django.urls import path, reverse
from django.shortcuts import render, redirect
from django.contrib import messages
from django.utils import timezone
from django.contrib.admin import SimpleListFilter
from .models import Lead, Dialer, DialerUserLink
from .soft_delete import SoftDeleteModel


@admin.action(description="Delete Forever (Permanent)")
def bulk_delete_forever_action(modeladmin, request, queryset):
    """Bulk delete forever action for leads"""
    count = queryset.count()
    if count == 0:
        modeladmin.message_user(request, "No leads selected.", level=messages.WARNING)
        return
    
    # Hard delete the leads
    deleted_count = 0
    for lead in queryset:
        lead.hard_delete()
        deleted_count += 1
    
    modeladmin.message_user(request, f"{deleted_count} leads permanently deleted. This action cannot be undone.", level=messages.WARNING)


@admin.action(description="Soft Delete Selected")
def bulk_soft_delete_action(modeladmin, request, queryset):
    """Bulk soft delete action for leads"""
    count = queryset.filter(is_deleted=False).count()
    if count == 0:
        modeladmin.message_user(request, "No active leads selected.", level=messages.WARNING)
        return
    
    # Soft delete only active leads
    active_leads = queryset.filter(is_deleted=False)
    for lead in active_leads:
        lead.soft_delete(deleted_by=request.user, reason="Bulk deleted via admin")
    
    modeladmin.message_user(request, f"{count} leads soft deleted.", level=messages.SUCCESS)


class SoftDeleteAdminMixin:
    """
    Mixin for admin classes to handle soft delete functionality
    """
    def get_queryset(self, request):
        """Show all objects including deleted ones"""
        return self.model.all_objects.all()
    
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


@admin.register(Dialer)
class DialerAdmin(admin.ModelAdmin):
    """
    Admin interface for Dialer model.
    """
    list_display = ('is_active', 'created_by', 'created_at')
    list_filter = ('is_active', 'created_at')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Lead)
class LeadAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    """
    Enhanced admin interface for Lead model with soft delete support.
    """
    list_display = ('full_name', 'phone', 'email', 'status', 'assigned_agent', 'soft_delete_status', 'created_at')
    list_filter = ('status', 'disposition', 'is_deleted', 'assigned_agent', 'field_sales_rep', 'created_at')
    search_fields = ('full_name', 'phone', 'email')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'deleted_at', 'deleted_by', 'deletion_reason')
    actions = [bulk_soft_delete_action, bulk_delete_forever_action]
    
    def get_actions(self, request):
        """Override to ensure actions are available"""
        actions = super().get_actions(request)
        return actions
    
    fieldsets = (
        ('Lead Information', {
            'fields': ('full_name', 'phone', 'email', 'status', 'disposition')
        }),
        ('Assignment', {
            'fields': ('assigned_agent', 'field_sales_rep')
        }),
        ('Appointment & Sales', {
            'fields': ('appointment_date', 'google_calendar_event_id', 'sale_amount'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Soft Delete Information', {
            'fields': ('is_deleted', 'deleted_at', 'deleted_by', 'deletion_reason'),
            'classes': ('collapse',)
        }),
    )
    
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
    
    def delete_model(self, request, obj):
        """Override delete to use soft delete"""
        obj.soft_delete(deleted_by=request.user, reason="Deleted via admin")
    
    def delete_queryset(self, request, queryset):
        """Override bulk delete to use soft delete"""
        for obj in queryset:
            obj.soft_delete(deleted_by=request.user, reason="Bulk deleted via admin")


@admin.register(DialerUserLink)
class DialerUserLinkAdmin(admin.ModelAdmin):
    """
    Enhanced admin interface for DialerUserLink model.
    """
    list_display = ('dialer_user_id', 'crm_user', 'crm_user_role', 'created_at', 'updated_at')
    list_filter = ('crm_user__role', 'created_at', 'updated_at')
    search_fields = ('dialer_user_id', 'crm_user__username', 'crm_user__first_name', 'crm_user__last_name', 'crm_user__email')
    autocomplete_fields = ('crm_user',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Dialer Information', {
            'fields': ('dialer_user_id',)
        }),
        ('CRM User Mapping', {
            'fields': ('crm_user',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def crm_user_role(self, obj):
        """Display the role of the linked CRM user."""
        return obj.crm_user.get_role_display() if obj.crm_user else '-'
    
    crm_user_role.short_description = 'User Role'
    crm_user_role.admin_order_field = 'crm_user__role'
    

