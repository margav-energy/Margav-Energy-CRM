from django.contrib import admin
from django.utils.html import format_html
from django.urls import path, reverse
from django.shortcuts import render, redirect
from django.contrib import messages
from django.utils import timezone
from django.contrib.admin import SimpleListFilter
from django.http import HttpResponse
from django.utils import timezone
from django import forms
from .models import Lead, Dialer, DialerUserLink
from .soft_delete import SoftDeleteModel
from .export_utils import export_leads_to_excel, export_leads_to_csv, create_excel_response, create_csv_response
from .google_sheets_service import google_sheets_service
from .excel_parser import ExcelLeadParser
from .forms import JsonUploadForm


class ExcelUploadForm(forms.Form):
    """Form for Excel file upload"""
    excel_file = forms.FileField(
        label='Excel File',
        help_text='Upload an Excel file (.xlsx or .xls) with lead data. Required columns: Agent, Date & Time, Customer Name, Customer Number, Customer address, Customer Postcode, Contact Centre Notes, Outcome, Kelly Notes, Data Source',
        widget=forms.FileInput(attrs={'accept': '.xlsx,.xls'})
    )


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


@admin.action(description="Download Selected as Excel")
def download_excel_action(modeladmin, request, queryset):
    """Download selected leads as Excel file"""
    if not queryset.exists():
        modeladmin.message_user(request, "No leads selected.", level=messages.WARNING)
        return
    
    try:
        excel_data = export_leads_to_excel(queryset)
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f"leads_export_{timestamp}.xlsx"
        return create_excel_response(excel_data, filename)
    except Exception as e:
        modeladmin.message_user(request, f"Error creating Excel file: {str(e)}", level=messages.ERROR)
        return None


@admin.action(description="Download Selected as CSV")
def download_csv_action(modeladmin, request, queryset):
    """Download selected leads as CSV file"""
    if not queryset.exists():
        modeladmin.message_user(request, "No leads selected.", level=messages.WARNING)
        return
    
    try:
        csv_data = export_leads_to_csv(queryset)
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f"leads_export_{timestamp}.csv"
        return create_csv_response(csv_data, filename)
    except Exception as e:
        modeladmin.message_user(request, f"Error creating CSV file: {str(e)}", level=messages.ERROR)
        return None


@admin.action(description="Sync Selected to Google Sheets")
def sync_to_sheets_action(modeladmin, request, queryset):
    """Sync selected leads to Google Sheets"""
    if not queryset.exists():
        modeladmin.message_user(request, "No leads selected.", level=messages.WARNING)
        return
    
    try:
        success_count = 0
        for lead in queryset:
            if google_sheets_service.sync_lead_to_sheets(lead):
                success_count += 1
        
        if success_count > 0:
            modeladmin.message_user(
                request, 
                f"Successfully synced {success_count} leads to Google Sheets.", 
                level=messages.SUCCESS
            )
        else:
            modeladmin.message_user(
                request, 
                "Failed to sync leads to Google Sheets. Check configuration.", 
                level=messages.ERROR
            )
    except Exception as e:
        modeladmin.message_user(request, f"Error syncing to Google Sheets: {str(e)}", level=messages.ERROR)


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
    list_display = ('lead_number', 'full_name', 'phone', 'status', 'assigned_agent_display', 'soft_delete_status', 'created_at')
    list_filter = ('status', 'disposition', 'is_deleted', 'assigned_agent', 'field_sales_rep', 'created_at')
    search_fields = ('lead_number', 'full_name', 'phone', 'email', 'notes')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'deleted_at', 'deleted_by', 'deletion_reason', 
                      'contact_centre_notes_display', 'kelly_notes_display', 'data_source_display', 'assigned_agent_name')
    actions = [bulk_soft_delete_action, bulk_delete_forever_action, download_excel_action, download_csv_action, sync_to_sheets_action]
    
    def get_actions(self, request):
        """Override to ensure actions are available"""
        actions = super().get_actions(request)
        return actions
    
    fieldsets = (
        ('Lead Information', {
            'fields': ('lead_number', 'full_name', 'phone', 'email', 'status', 'disposition')
        }),
        ('Assignment', {
            'fields': ('assigned_agent', 'assigned_agent_name', 'field_sales_rep')
        }),
        ('Contact Details', {
            'fields': ('address1', 'address2', 'address3', 'city', 'state', 'postal_code', 'country_code'),
            'classes': ('collapse',)
        }),
        ('Call Information', {
            'fields': ('contact_centre_notes_display', 'kelly_notes_display', 'data_source_display'),
            'classes': ('collapse',)
        }),
        ('Appointment & Sales', {
            'fields': ('appointment_date', 'google_calendar_event_id', 'sale_amount'),
            'classes': ('collapse',)
        }),
        ('Energy Details', {
            'fields': ('energy_bill_amount', 'has_ev_charger', 'day_night_rate', 'has_previous_quotes', 'previous_quotes_details'),
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
    
    def assigned_agent_display(self, obj):
        """Display assigned agent name, showing stored name if agent is deleted"""
        if obj.assigned_agent:
            # Agent exists, show current name
            agent_name = obj.assigned_agent.get_full_name() or obj.assigned_agent.username
            return format_html('<span>{}</span>', agent_name)
        elif obj.assigned_agent_name:
            # Agent deleted but name preserved, show stored name with indicator
            return format_html('<span style="color: #666; font-style: italic;">{} <span style="font-size: 0.85em;">(deleted)</span></span>', obj.assigned_agent_name)
        else:
            return format_html('<span style="color: #999;">-</span>')
    
    assigned_agent_display.short_description = 'Assigned Agent'
    assigned_agent_display.admin_order_field = 'assigned_agent'
    
    def contact_centre_notes_display(self, obj):
        """Extract Contact Centre Notes from notes field"""
        if not obj.notes:
            return "Not provided"
        
        # Look for Contact Centre Notes in the notes field
        lines = obj.notes.split('\n')
        for line in lines:
            if line.startswith('Contact Centre Notes:'):
                return line.replace('Contact Centre Notes:', '').strip()
        return "Not found in notes"
    
    contact_centre_notes_display.short_description = 'Contact Centre Notes'
    contact_centre_notes_display.admin_order_field = 'notes'
    
    def outcome_display(self, obj):
        """Extract Outcome from notes field"""
        if not obj.notes:
            return "Not provided"
        
        # Look for Outcome in the notes field
        lines = obj.notes.split('\n')
        for line in lines:
            if line.startswith('Outcome:'):
                return line.replace('Outcome:', '').strip()
        return "Not found in notes"
    
    outcome_display.short_description = 'Outcome'
    outcome_display.admin_order_field = 'notes'
    
    def kelly_notes_display(self, obj):
        """Extract Kelly Notes from notes field"""
        if not obj.notes:
            return "Not provided"
        
        # Look for Kelly Notes in the notes field
        lines = obj.notes.split('\n')
        for line in lines:
            if line.startswith('Kelly Notes:'):
                return line.replace('Kelly Notes:', '').strip()
        return "Not found in notes"
    
    kelly_notes_display.short_description = 'Kelly Notes'
    kelly_notes_display.admin_order_field = 'notes'
    
    def data_source_display(self, obj):
        """Extract Data Source from notes field"""
        if not obj.notes:
            return "Not provided"
        
        # Look for Data Source in the notes field
        lines = obj.notes.split('\n')
        for line in lines:
            if line.startswith('Data Source:'):
                return line.replace('Data Source:', '').strip()
        return "Not found in notes"
    
    data_source_display.short_description = 'Data Source'
    data_source_display.admin_order_field = 'notes'
    
    def delete_model(self, request, obj):
        """Override delete to use soft delete"""
        obj.soft_delete(deleted_by=request.user, reason="Deleted via admin")
    
    def delete_queryset(self, request, queryset):
        """Override bulk delete to use soft delete"""
        for obj in queryset:
            obj.soft_delete(deleted_by=request.user, reason="Bulk deleted via admin")
    
    def get_urls(self):
        """Add custom URLs for download functionality"""
        urls = super().get_urls()
        custom_urls = [
            path('download-all-excel/', self.download_all_excel, name='leads_lead_download_all_excel'),
            path('download-all-csv/', self.download_all_csv, name='leads_lead_download_all_csv'),
            path('sync-all-sheets/', self.sync_all_sheets, name='leads_lead_sync_all_sheets'),
            path('upload-json/', self.upload_json, name='leads_lead_upload_json'),
        ]
        return custom_urls + urls
    
    def download_all_excel(self, request):
        """Download all leads as Excel"""
        try:
            excel_data = export_leads_to_excel()
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            filename = f"all_leads_export_{timestamp}.xlsx"
            return create_excel_response(excel_data, filename)
        except Exception as e:
            messages.error(request, f"Error creating Excel file: {str(e)}")
            return redirect('..')
    
    def download_all_csv(self, request):
        """Download all leads as CSV"""
        try:
            csv_data = export_leads_to_csv()
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            filename = f"all_leads_export_{timestamp}.csv"
            return create_csv_response(csv_data, filename)
        except Exception as e:
            messages.error(request, f"Error creating CSV file: {str(e)}")
            return redirect('..')
    
    def sync_all_sheets(self, request):
        """Sync all leads to Google Sheets"""
        try:
            result = google_sheets_service.sync_all_leads_to_sheets()
            if result['success'] > 0:
                messages.success(request, f"Successfully synced {result['success']} leads to Google Sheets.")
            else:
                messages.warning(request, "No leads found to sync.")
        except Exception as e:
            messages.error(request, f"Error syncing to Google Sheets: {str(e)}")
        return redirect('..')
    
    def upload_json(self, request):
        """Upload JSON file and bulk import leads"""
        if request.method == 'POST':
            form = JsonUploadForm(request.POST, request.FILES)
            if form.is_valid():
                json_file = request.FILES['json_file']
                
                # Validate file type
                if not json_file.name.endswith('.json'):
                    messages.error(request, 'Invalid file type. Please upload a JSON file (.json)')
                    return render(request, 'admin/leads/lead/upload_json.html', {'form': form})
                
                try:
                    # Parse JSON file
                    import json
                    from io import TextIOWrapper
                    
                    # Read JSON file
                    json_data = json.load(TextIOWrapper(json_file, encoding='utf-8'))
                    
                    # Validate JSON structure
                    if not isinstance(json_data, list):
                        messages.error(request, 'JSON file must contain an array of lead objects')
                        return render(request, 'admin/leads/lead/upload_json.html', {'form': form})
                    
                    # Process leads
                    created_count = 0
                    failed_count = 0
                    errors = []
                    
                    for index, lead_data in enumerate(json_data):
                        try:
                            # Validate required fields
                            required_fields = ['full_name', 'phone']
                            missing_fields = [field for field in required_fields if field not in lead_data]
                            if missing_fields:
                                errors.append(f"Lead {index + 1}: Missing required fields: {', '.join(missing_fields)}")
                                failed_count += 1
                                continue
                            
                            # Map JSON data to Lead model fields
                            lead_obj_data = {
                                'full_name': str(lead_data.get('full_name', '')).strip(),
                                'phone': str(lead_data.get('phone', '')).strip(),
                                'email': lead_data.get('email', ''),
                                'address1': lead_data.get('address1', ''),
                                'city': lead_data.get('city', ''),
                                'postal_code': lead_data.get('postal_code', ''),
                                'notes': lead_data.get('notes', ''),
                                'status': lead_data.get('status', 'cold_call'),
                                'energy_bill_amount': lead_data.get('energy_bill_amount'),
                                'has_ev_charger': lead_data.get('has_ev_charger'),
                                'day_night_rate': lead_data.get('day_night_rate'),
                                'has_previous_quotes': lead_data.get('has_previous_quotes'),
                                'previous_quotes_details': lead_data.get('previous_quotes_details'),
                            }
                            
                            # Find agent by ID or username
                            if 'assigned_agent' in lead_data:
                                try:
                                    agent_id = lead_data['assigned_agent']
                                    if isinstance(agent_id, int):
                                        agent = User.objects.get(id=agent_id)
                                    else:
                                        agent = User.objects.get(username=agent_id)
                                    lead_obj_data['assigned_agent'] = agent
                                except User.DoesNotExist:
                                    errors.append(f"Lead {index + 1}: Agent not found: {agent_id}")
                                    failed_count += 1
                                    continue
                            
                            # Parse appointment date if provided
                            if 'appointment_date' in lead_data and lead_data['appointment_date']:
                                try:
                                    from datetime import datetime
                                    appointment_date = datetime.fromisoformat(lead_data['appointment_date'].replace('Z', '+00:00'))
                                    lead_obj_data['appointment_date'] = appointment_date
                                except:
                                    pass  # Skip if date parsing fails
                            
                            # Create lead
                            Lead.objects.create(**lead_obj_data)
                            created_count += 1
                            
                        except Exception as e:
                            errors.append(f"Lead {index + 1}: {str(e)}")
                            failed_count += 1
                            continue
                    
                    # Show results
                    if created_count > 0:
                        messages.success(request, f'Successfully imported {created_count} leads')
                    
                    if failed_count > 0:
                        messages.warning(request, f'{failed_count} leads failed to import')
                    
                    # Show errors (limit to first 10)
                    for error in errors[:10]:
                        messages.error(request, error)
                    
                    if len(errors) > 10:
                        messages.warning(request, f'... and {len(errors) - 10} more errors')
                    
                    return redirect('..')
                    
                except json.JSONDecodeError as e:
                    messages.error(request, f'Invalid JSON format: {str(e)}')
                    return render(request, 'admin/leads/lead/upload_json.html', {'form': form})
                except Exception as e:
                    messages.error(request, f'Error processing JSON file: {str(e)}')
                    return render(request, 'admin/leads/lead/upload_json.html', {'form': form})
            else:
                messages.error(request, 'Please correct the errors below')
        else:
            form = JsonUploadForm()
        
        return render(request, 'admin/leads/lead/upload_json.html', {'form': form})


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
    

