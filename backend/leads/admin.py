from django.contrib import admin
from .models import Lead, Dialer, DialerUserLink


@admin.register(Dialer)
class DialerAdmin(admin.ModelAdmin):
    """
    Admin interface for Dialer model.
    """
    list_display = ('is_active', 'created_by', 'created_at')
    list_filter = ('is_active', 'created_at')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    """
    Admin interface for Lead model.
    """
    list_display = ('full_name', 'phone', 'email', 'status', 'disposition', 'assigned_agent', 'field_sales_rep', 'created_at')
    list_filter = ('status', 'disposition', 'assigned_agent', 'field_sales_rep', 'created_at')
    search_fields = ('full_name', 'phone', 'email')
    ordering = ('-created_at',)
    
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
    )
    
    readonly_fields = ('created_at', 'updated_at')


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