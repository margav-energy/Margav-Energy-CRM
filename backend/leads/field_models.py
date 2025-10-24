from django.db import models
from django.conf import settings
from django.utils import timezone
from .soft_delete import SoftDeleteModel
import json

class FieldSubmission(SoftDeleteModel):
    """
    Model for field agent property assessments.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    
    PROPERTY_TYPE_CHOICES = [
        ('detached', 'Detached House'),
        ('semi-detached', 'Semi-Detached House'),
        ('terraced', 'Terraced House'),
        ('flat', 'Flat/Apartment'),
        ('bungalow', 'Bungalow'),
    ]
    
    ROOF_TYPE_CHOICES = [
        ('tiled', 'Tiled'),
        ('slate', 'Slate'),
        ('metal', 'Metal'),
        ('flat', 'Flat'),
        ('thatched', 'Thatched'),
    ]
    
    ROOF_CONDITION_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    ]
    
    HEATING_TYPE_CHOICES = [
        ('gas', 'Gas'),
        ('electric', 'Electric'),
        ('oil', 'Oil'),
        ('lpg', 'LPG'),
        ('heat-pump', 'Heat Pump'),
    ]
    
    HOT_WATER_TYPE_CHOICES = [
        ('gas', 'Gas'),
        ('electric', 'Electric'),
        ('oil', 'Oil'),
        ('solar', 'Solar'),
    ]
    
    # Field agent who conducted the assessment
    field_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='field_submissions',
        help_text='Field agent who conducted the assessment'
    )
    
    # Customer information
    customer_name = models.CharField(max_length=255, help_text='Customer full name')
    phone = models.CharField(max_length=20, help_text='Customer phone number')
    email = models.EmailField(blank=True, null=True, help_text='Customer email address')
    address = models.TextField(help_text='Property address')
    city = models.CharField(max_length=100, blank=True, help_text='City')
    postal_code = models.CharField(max_length=20, blank=True, help_text='Postal code')
    
    # Property assessment
    property_type = models.CharField(
        max_length=20,
        choices=PROPERTY_TYPE_CHOICES,
        blank=True,
        help_text='Type of property'
    )
    roof_type = models.CharField(
        max_length=20,
        choices=ROOF_TYPE_CHOICES,
        blank=True,
        help_text='Type of roof'
    )
    roof_condition = models.CharField(
        max_length=20,
        choices=ROOF_CONDITION_CHOICES,
        blank=True,
        help_text='Condition of roof'
    )
    roof_age = models.CharField(max_length=20, blank=True, help_text='Age of roof')
    
    # Energy information
    current_energy_supplier = models.CharField(max_length=100, blank=True, help_text='Current energy supplier')
    monthly_bill = models.CharField(max_length=50, blank=True, help_text='Monthly energy bill')
    heating_type = models.CharField(
        max_length=20,
        choices=HEATING_TYPE_CHOICES,
        blank=True,
        help_text='Type of heating system'
    )
    hot_water_type = models.CharField(
        max_length=20,
        choices=HOT_WATER_TYPE_CHOICES,
        blank=True,
        help_text='Type of hot water system'
    )
    insulation_type = models.CharField(max_length=100, blank=True, help_text='Type of insulation')
    windows_type = models.CharField(max_length=100, blank=True, help_text='Type of windows')
    property_age = models.CharField(max_length=50, blank=True, help_text='Age of property')
    occupancy = models.CharField(max_length=50, blank=True, help_text='Occupancy status')
    
    # Additional information
    notes = models.TextField(blank=True, help_text='Additional notes and observations')
    
    # Media files (stored as JSON)
    photos = models.JSONField(default=list, help_text='Base64 encoded photos')
    signature = models.TextField(blank=True, help_text='Base64 encoded customer signature')
    
    # Status and timestamps
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text='Current status of the submission'
    )
    timestamp = models.DateTimeField(
        default=timezone.now,
        help_text='When the assessment was conducted'
    )
    
    # Review information
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_submissions',
        help_text='Qualifier who reviewed the submission'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True, help_text='When the submission was reviewed')
    review_notes = models.TextField(blank=True, help_text='Qualifier review notes')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Field Submission'
        verbose_name_plural = 'Field Submissions'
    
    def __str__(self):
        return f"{self.customer_name} - {self.address} ({self.get_status_display()})"
    
    def get_photo_count(self):
        """Get the number of photos in this submission."""
        if isinstance(self.photos, list):
            return len(self.photos)
        return 0
    
    def has_signature(self):
        """Check if the submission has a customer signature."""
        return bool(self.signature)
    
    def get_formatted_notes(self):
        """Get formatted notes for display."""
        notes = f"Field Assessment - {self.timestamp.strftime('%Y-%m-%d %H:%M')}\n\n"
        
        notes += f"Property Type: {self.get_property_type_display() or 'Not specified'}\n"
        notes += f"Roof Type: {self.get_roof_type_display() or 'Not specified'}\n"
        notes += f"Roof Condition: {self.get_roof_condition_display() or 'Not specified'}\n"
        notes += f"Roof Age: {self.roof_age or 'Not specified'}\n"
        notes += f"Current Energy Supplier: {self.current_energy_supplier or 'Not specified'}\n"
        notes += f"Monthly Bill: {self.monthly_bill or 'Not specified'}\n"
        notes += f"Heating Type: {self.get_heating_type_display() or 'Not specified'}\n"
        notes += f"Hot Water Type: {self.get_hot_water_type_display() or 'Not specified'}\n"
        notes += f"Insulation Type: {self.insulation_type or 'Not specified'}\n"
        notes += f"Windows Type: {self.windows_type or 'Not specified'}\n"
        notes += f"Property Age: {self.property_age or 'Not specified'}\n"
        notes += f"Occupancy: {self.occupancy or 'Not specified'}\n"
        
        if self.notes:
            notes += f"\nAdditional Notes:\n{self.notes}\n"
        
        notes += f"\nPhotos: {self.get_photo_count()} taken\n"
        notes += f"Signature: {'Captured' if self.has_signature() else 'Not captured'}\n"
        
        return notes
from django.conf import settings
from django.utils import timezone
from .soft_delete import SoftDeleteModel
import json

class FieldSubmission(SoftDeleteModel):
    """
    Model for field agent property assessments.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    
    PROPERTY_TYPE_CHOICES = [
        ('detached', 'Detached House'),
        ('semi-detached', 'Semi-Detached House'),
        ('terraced', 'Terraced House'),
        ('flat', 'Flat/Apartment'),
        ('bungalow', 'Bungalow'),
    ]
    
    ROOF_TYPE_CHOICES = [
        ('tiled', 'Tiled'),
        ('slate', 'Slate'),
        ('metal', 'Metal'),
        ('flat', 'Flat'),
        ('thatched', 'Thatched'),
    ]
    
    ROOF_CONDITION_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    ]
    
    HEATING_TYPE_CHOICES = [
        ('gas', 'Gas'),
        ('electric', 'Electric'),
        ('oil', 'Oil'),
        ('lpg', 'LPG'),
        ('heat-pump', 'Heat Pump'),
    ]
    
    HOT_WATER_TYPE_CHOICES = [
        ('gas', 'Gas'),
        ('electric', 'Electric'),
        ('oil', 'Oil'),
        ('solar', 'Solar'),
    ]
    
    # Field agent who conducted the assessment
    field_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='field_submissions',
        help_text='Field agent who conducted the assessment'
    )
    
    # Customer information
    customer_name = models.CharField(max_length=255, help_text='Customer full name')
    phone = models.CharField(max_length=20, help_text='Customer phone number')
    email = models.EmailField(blank=True, null=True, help_text='Customer email address')
    address = models.TextField(help_text='Property address')
    city = models.CharField(max_length=100, blank=True, help_text='City')
    postal_code = models.CharField(max_length=20, blank=True, help_text='Postal code')
    
    # Property assessment
    property_type = models.CharField(
        max_length=20,
        choices=PROPERTY_TYPE_CHOICES,
        blank=True,
        help_text='Type of property'
    )
    roof_type = models.CharField(
        max_length=20,
        choices=ROOF_TYPE_CHOICES,
        blank=True,
        help_text='Type of roof'
    )
    roof_condition = models.CharField(
        max_length=20,
        choices=ROOF_CONDITION_CHOICES,
        blank=True,
        help_text='Condition of roof'
    )
    roof_age = models.CharField(max_length=20, blank=True, help_text='Age of roof')
    
    # Energy information
    current_energy_supplier = models.CharField(max_length=100, blank=True, help_text='Current energy supplier')
    monthly_bill = models.CharField(max_length=50, blank=True, help_text='Monthly energy bill')
    heating_type = models.CharField(
        max_length=20,
        choices=HEATING_TYPE_CHOICES,
        blank=True,
        help_text='Type of heating system'
    )
    hot_water_type = models.CharField(
        max_length=20,
        choices=HOT_WATER_TYPE_CHOICES,
        blank=True,
        help_text='Type of hot water system'
    )
    insulation_type = models.CharField(max_length=100, blank=True, help_text='Type of insulation')
    windows_type = models.CharField(max_length=100, blank=True, help_text='Type of windows')
    property_age = models.CharField(max_length=50, blank=True, help_text='Age of property')
    occupancy = models.CharField(max_length=50, blank=True, help_text='Occupancy status')
    
    # Additional information
    notes = models.TextField(blank=True, help_text='Additional notes and observations')
    
    # Media files (stored as JSON)
    photos = models.JSONField(default=list, help_text='Base64 encoded photos')
    signature = models.TextField(blank=True, help_text='Base64 encoded customer signature')
    
    # Status and timestamps
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text='Current status of the submission'
    )
    timestamp = models.DateTimeField(
        default=timezone.now,
        help_text='When the assessment was conducted'
    )
    
    # Review information
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_submissions',
        help_text='Qualifier who reviewed the submission'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True, help_text='When the submission was reviewed')
    review_notes = models.TextField(blank=True, help_text='Qualifier review notes')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Field Submission'
        verbose_name_plural = 'Field Submissions'
    
    def __str__(self):
        return f"{self.customer_name} - {self.address} ({self.get_status_display()})"
    
    def get_photo_count(self):
        """Get the number of photos in this submission."""
        if isinstance(self.photos, list):
            return len(self.photos)
        return 0
    
    def has_signature(self):
        """Check if the submission has a customer signature."""
        return bool(self.signature)
    
    def get_formatted_notes(self):
        """Get formatted notes for display."""
        notes = f"Field Assessment - {self.timestamp.strftime('%Y-%m-%d %H:%M')}\n\n"
        
        notes += f"Property Type: {self.get_property_type_display() or 'Not specified'}\n"
        notes += f"Roof Type: {self.get_roof_type_display() or 'Not specified'}\n"
        notes += f"Roof Condition: {self.get_roof_condition_display() or 'Not specified'}\n"
        notes += f"Roof Age: {self.roof_age or 'Not specified'}\n"
        notes += f"Current Energy Supplier: {self.current_energy_supplier or 'Not specified'}\n"
        notes += f"Monthly Bill: {self.monthly_bill or 'Not specified'}\n"
        notes += f"Heating Type: {self.get_heating_type_display() or 'Not specified'}\n"
        notes += f"Hot Water Type: {self.get_hot_water_type_display() or 'Not specified'}\n"
        notes += f"Insulation Type: {self.insulation_type or 'Not specified'}\n"
        notes += f"Windows Type: {self.windows_type or 'Not specified'}\n"
        notes += f"Property Age: {self.property_age or 'Not specified'}\n"
        notes += f"Occupancy: {self.occupancy or 'Not specified'}\n"
        
        if self.notes:
            notes += f"\nAdditional Notes:\n{self.notes}\n"
        
        notes += f"\nPhotos: {self.get_photo_count()} taken\n"
        notes += f"Signature: {'Captured' if self.has_signature() else 'Not captured'}\n"
        
        return notes






