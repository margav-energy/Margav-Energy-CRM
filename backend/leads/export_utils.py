"""
Utility functions for exporting lead data
"""
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    pd = None
from io import BytesIO
from django.http import HttpResponse
from django.utils import timezone
from .models import Lead

def export_leads_to_excel(queryset=None):
    """Export leads to Excel format"""
    if not PANDAS_AVAILABLE:
        raise ImportError("Pandas is not available. Excel export is disabled.")
    
    if queryset is None:
        queryset = Lead.objects.all()
    
    # Prepare data
    data = []
    for lead in queryset:
        data.append({
            'ID': lead.id,
            'Full Name': lead.full_name,
            'Phone': lead.phone,
            'Email': lead.email,
            'Address': f"{lead.address1 or ''} {lead.address2 or ''} {lead.address3 or ''}".strip(),
            'City': lead.city or '',
            'State': lead.state or '',
            'Postal Code': lead.postal_code or '',
            'Status': lead.status,
            'Assigned Agent': lead.assigned_agent.get_full_name() if lead.assigned_agent else '',
            'Created Date': lead.created_at.astimezone(timezone.get_current_timezone()).strftime('%Y-%m-%d %H:%M:%S') if lead.created_at else '',
            'Updated Date': lead.updated_at.astimezone(timezone.get_current_timezone()).strftime('%Y-%m-%d %H:%M:%S') if lead.updated_at else '',
            'Appointment Date': lead.appointment_date.astimezone(timezone.get_current_timezone()).strftime('%Y-%m-%d %H:%M:%S') if lead.appointment_date else '',
            'Notes': lead.notes,
            'Property Ownership': getattr(lead, 'property_ownership', '') or '',
            'Property Type': getattr(lead, 'property_type', '') or '',
            'Number of Bedrooms': getattr(lead, 'number_of_bedrooms', '') or '',
            'Roof Type': getattr(lead, 'roof_type', '') or '',
            'Roof Material': getattr(lead, 'roof_material', '') or '',
            'Energy Bill Amount': getattr(lead, 'energy_bill_amount', '') or '',
            'Current Energy Supplier': getattr(lead, 'current_energy_supplier', '') or '',
            'Timeframe': getattr(lead, 'timeframe', '') or '',
            'Is Deleted': 'Yes' if lead.is_deleted else 'No',
            'Deleted Date': lead.deleted_at.astimezone().strftime('%Y-%m-%d %H:%M:%S') if lead.deleted_at else '',
            'Deleted By': lead.deleted_by.get_full_name() if lead.deleted_by else '',
            'Deletion Reason': lead.deletion_reason or ''
        })
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Leads', index=False)
    
    output.seek(0)
    return output.getvalue()

def export_leads_to_csv(queryset=None):
    """Export leads to CSV format"""
    if queryset is None:
        queryset = Lead.objects.all()
    
    # Prepare data
    data = []
    for lead in queryset:
        data.append({
            'ID': lead.id,
            'Full Name': lead.full_name,
            'Phone': lead.phone,
            'Email': lead.email,
            'Address': f"{lead.address1 or ''} {lead.address2 or ''} {lead.address3 or ''}".strip(),
            'City': lead.city or '',
            'State': lead.state or '',
            'Postal Code': lead.postal_code or '',
            'Status': lead.status,
            'Assigned Agent': lead.assigned_agent.get_full_name() if lead.assigned_agent else '',
            'Created Date': lead.created_at.astimezone(timezone.get_current_timezone()).strftime('%Y-%m-%d %H:%M:%S') if lead.created_at else '',
            'Updated Date': lead.updated_at.astimezone(timezone.get_current_timezone()).strftime('%Y-%m-%d %H:%M:%S') if lead.updated_at else '',
            'Appointment Date': lead.appointment_date.astimezone(timezone.get_current_timezone()).strftime('%Y-%m-%d %H:%M:%S') if lead.appointment_date else '',
            'Notes': lead.notes,
            'Property Ownership': getattr(lead, 'property_ownership', '') or '',
            'Property Type': getattr(lead, 'property_type', '') or '',
            'Number of Bedrooms': getattr(lead, 'number_of_bedrooms', '') or '',
            'Roof Type': getattr(lead, 'roof_type', '') or '',
            'Roof Material': getattr(lead, 'roof_material', '') or '',
            'Energy Bill Amount': getattr(lead, 'energy_bill_amount', '') or '',
            'Current Energy Supplier': getattr(lead, 'current_energy_supplier', '') or '',
            'Timeframe': getattr(lead, 'timeframe', '') or '',
            'Is Deleted': 'Yes' if lead.is_deleted else 'No',
            'Deleted Date': lead.deleted_at.astimezone().strftime('%Y-%m-%d %H:%M:%S') if lead.deleted_at else '',
            'Deleted By': lead.deleted_by.get_full_name() if lead.deleted_by else '',
            'Deletion Reason': lead.deletion_reason or ''
        })
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Create CSV in memory
    output = BytesIO()
    df.to_csv(output, index=False, encoding='utf-8')
    output.seek(0)
    return output.getvalue()

def create_excel_response(data, filename):
    """Create HTTP response for Excel download"""
    response = HttpResponse(
        data,
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response

def create_csv_response(data, filename):
    """Create HTTP response for CSV download"""
    response = HttpResponse(data, content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response
