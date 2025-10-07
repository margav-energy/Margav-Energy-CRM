from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.contrib import messages
from django.shortcuts import redirect
from django.http import HttpResponseRedirect
from .models import User

# Set custom admin site template and title
admin.site.index_template = 'admin/index.html'
admin.site.site_header = 'Margav Energy CRM Administration'
admin.site.site_title = 'Margav Energy CRM'
admin.site.index_title = 'Margav Energy CRM Administration'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin interface for User model with enhanced features for dialer integration.
    """
    list_display = ('username', 'email', 'role', 'first_name', 'last_name', 'is_active', 'dialer_links_count', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    change_list_template = 'admin/accounts/user/change_list.html'
    change_form_template = 'admin/accounts/user/change_form.html'
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Information', {'fields': ('first_name', 'last_name', 'email')}),
        ('Role Information', {'fields': ('role', 'phone')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',),
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',),
        }),
        ('Dialer Integration', {
            'fields': ('dialer_links_count',),
            'classes': ('collapse',),
            'description': 'View dialer user links for this user'
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2'),
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'email'),
        }),
        ('Role Information', {
            'fields': ('role', 'phone'),
        }),
    )
    
    readonly_fields = ('dialer_links_count',)
    
    def dialer_links_count(self, obj):
        """Display count of dialer links for this user."""
        if obj.pk:
            # Use the related_name from DialerUserLink model
            if hasattr(obj, 'dialer_link') and obj.dialer_link:
                admin_url = reverse('admin:leads_dialeruserlink_change', args=[obj.dialer_link.pk])
                return mark_safe(f'<a href="{admin_url}">{obj.dialer_link.dialer_user_id}</a>')
            else:
                return "No dialer link"
        return "Save user first"
    
    dialer_links_count.short_description = "Dialer User Links"
    
    def get_queryset(self, request):
        """Optimize queryset with prefetch_related for dialer links."""
        return super().get_queryset(request).prefetch_related('dialer_link')
    
    actions = ['create_dialer_users_action', 'delete_selected_users', 'reset_user_passwords']
    
    def create_dialer_users_action(self, request, queryset):
        """Admin action to create dialer users with links."""
        from django.core.management import call_command
        from io import StringIO
        import sys
        
        # Capture output
        old_stdout = sys.stdout
        sys.stdout = captured_output = StringIO()
        
        try:
            # Run the management command
            call_command('create_dialer_users', verbosity=2)
            output = captured_output.getvalue()
            
            # Show success message with output
            self.message_user(
                request,
                f"Dialer users created successfully!\n{output}",
                level=messages.SUCCESS
            )
        except Exception as e:
            self.message_user(
                request,
                f"Error creating dialer users: {str(e)}",
                level=messages.ERROR
            )
        finally:
            sys.stdout = old_stdout
    
    create_dialer_users_action.short_description = "Create Dialer Users (Run Management Command)"
    
    def delete_selected_users(self, request, queryset):
        """Admin action to delete selected users."""
        if request.POST.get('post'):
            # User confirmed deletion
            deleted_count = 0
            for user in queryset:
                if not user.is_superuser:
                    # Delete associated dialer links
                    from leads.models import DialerUserLink
                    DialerUserLink.objects.filter(crm_user=user).delete()
                    user.delete()
                    deleted_count += 1
            
            self.message_user(
                request,
                f"Successfully deleted {deleted_count} users.",
                level=messages.SUCCESS
            )
        else:
            # Show confirmation page
            return render(request, 'admin/delete_selected_confirmation.html', {
                'objects': queryset,
                'opts': self.model._meta,
                'action_name': 'delete_selected_users',
            })
    
    delete_selected_users.short_description = "Delete selected users"
    
    def reset_user_passwords(self, request, queryset):
        """Admin action to reset passwords for selected users."""
        password = '123'  # Default password
        updated_count = 0
        
        for user in queryset:
            user.set_password(password)
            user.save()
            updated_count += 1
        
        self.message_user(
            request,
            f"Successfully reset passwords for {updated_count} users to '{password}'.",
            level=messages.SUCCESS
        )
    
    reset_user_passwords.short_description = "Reset passwords to '123'"
