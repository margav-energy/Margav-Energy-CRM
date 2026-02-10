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
            'Assigned Agent': lead.assigned_agent.get_full_name() if lead.assigned_agent else (lead.assigned_agent_name or ''),
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
    """Export leads to CSV format using Python's built-in csv module"""
    import csv
    
    if queryset is None:
        queryset = Lead.objects.all()
    
    # Create CSV in memory as text, then encode
    from io import StringIO
    output = StringIO()
    
    # Define field names
    fieldnames = [
        'ID', 'Full Name', 'Phone', 'Email', 'Address', 'City', 'State', 'Postal Code',
        'Status', 'Assigned Agent', 'Created Date', 'Updated Date', 'Appointment Date',
        'Notes', 'Property Ownership', 'Property Type', 'Number of Bedrooms',
        'Roof Type', 'Roof Material', 'Energy Bill Amount', 'Current Energy Supplier',
        'Timeframe', 'Is Deleted', 'Deleted Date', 'Deleted By', 'Deletion Reason'
    ]
    
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    
    # Write data rows
    for lead in queryset:
        writer.writerow({
            'ID': lead.id,
            'Full Name': lead.full_name,
            'Phone': lead.phone,
            'Email': lead.email or '',
            'Address': f"{lead.address1 or ''} {lead.address2 or ''} {lead.address3 or ''}".strip(),
            'City': lead.city or '',
            'State': lead.state or '',
            'Postal Code': lead.postal_code or '',
            'Status': lead.status,
            'Assigned Agent': lead.assigned_agent.get_full_name() if lead.assigned_agent else (lead.assigned_agent_name or ''),
            'Created Date': lead.created_at.astimezone(timezone.get_current_timezone()).strftime('%Y-%m-%d %H:%M:%S') if lead.created_at else '',
            'Updated Date': lead.updated_at.astimezone(timezone.get_current_timezone()).strftime('%Y-%m-%d %H:%M:%S') if lead.updated_at else '',
            'Appointment Date': lead.appointment_date.astimezone(timezone.get_current_timezone()).strftime('%Y-%m-%d %H:%M:%S') if lead.appointment_date else '',
            'Notes': lead.notes or '',
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
    
    # Get the string value and encode to bytes
    csv_string = output.getvalue()
    # Add BOM for Excel compatibility
    return ('\ufeff' + csv_string).encode('utf-8')

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
