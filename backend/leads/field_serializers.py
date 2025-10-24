from rest_framework import serializers
from django.contrib.auth import get_user_model
from .field_models import FieldSubmission

User = get_user_model()


class FieldSubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for field submissions (read operations).
    """
    field_agent_name = serializers.CharField(source='field_agent.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    photo_count = serializers.SerializerMethodField()
    has_signature = serializers.SerializerMethodField()
    formatted_notes = serializers.SerializerMethodField()
    
    class Meta:
        model = FieldSubmission
        fields = [
            'id',
            'field_agent',
            'field_agent_name',
            'customer_name',
            'phone',
            'email',
            'address',
            'city',
            'postal_code',
            'property_type',
            'roof_type',
            'roof_condition',
            'roof_age',
            'current_energy_supplier',
            'monthly_bill',
            'heating_type',
            'hot_water_type',
            'insulation_type',
            'windows_type',
            'property_age',
            'occupancy',
            'notes',
            'photos',
            'signature',
            'status',
            'timestamp',
            'reviewed_by',
            'reviewed_by_name',
            'reviewed_at',
            'review_notes',
            'photo_count',
            'has_signature',
            'formatted_notes',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'field_agent',
            'field_agent_name',
            'reviewed_by',
            'reviewed_by_name',
            'reviewed_at',
            'photo_count',
            'has_signature',
            'formatted_notes',
            'created_at',
            'updated_at'
        ]
    
    def get_photo_count(self, obj):
        return obj.get_photo_count()
    
    def get_has_signature(self, obj):
        return obj.has_signature()
    
    def get_formatted_notes(self, obj):
        return obj.get_formatted_notes()


class FieldSubmissionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating field submissions.
    """
    class Meta:
        model = FieldSubmission
        fields = [
            'customer_name',
            'phone',
            'email',
            'address',
            'city',
            'postal_code',
            'property_type',
            'roof_type',
            'roof_condition',
            'roof_age',
            'current_energy_supplier',
            'monthly_bill',
            'heating_type',
            'hot_water_type',
            'insulation_type',
            'windows_type',
            'property_age',
            'occupancy',
            'notes',
            'photos',
            'signature',
            'timestamp'
        ]
    
    def validate_customer_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Customer name is required.")
        return value.strip()
    
    def validate_phone(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Phone number is required.")
        return value.strip()
    
    def validate_address(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Address is required.")
        return value.strip()
    
    def validate_photos(self, value):
        if not value or not isinstance(value, list):
            raise serializers.ValidationError("At least one photo is required.")
        
        if len(value) == 0:
            raise serializers.ValidationError("At least one photo is required.")
        
        # Validate that photos are base64 strings
        for i, photo in enumerate(value):
            if not isinstance(photo, str) or not photo.startswith('data:image/'):
                raise serializers.ValidationError(f"Photo {i+1} must be a valid base64 image.")
        
        return value
    
    def validate_signature(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Customer signature is required.")
        
        if not value.startswith('data:image/'):
            raise serializers.ValidationError("Signature must be a valid base64 image.")
        
        return value
    
    def validate_timestamp(self, value):
        if not value:
            raise serializers.ValidationError("Timestamp is required.")
        return value


class FieldSubmissionUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating field submissions (qualifier review).
    """
    class Meta:
        model = FieldSubmission
        fields = [
            'status',
            'review_notes'
        ]
    
    def validate_status(self, value):
        valid_statuses = ['pending', 'under_review', 'completed', 'rejected']
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(valid_statuses)}")
        return value


class FieldSubmissionListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing field submissions.
    """
    field_agent_name = serializers.CharField(source='field_agent.get_full_name', read_only=True)
    photo_count = serializers.SerializerMethodField()
    has_signature = serializers.SerializerMethodField()
    
    class Meta:
        model = FieldSubmission
        fields = [
            'id',
            'field_agent_name',
            'customer_name',
            'phone',
            'address',
            'city',
            'status',
            'timestamp',
            'photo_count',
            'has_signature',
            'created_at'
        ]
    
    def get_photo_count(self, obj):
        return obj.get_photo_count()
    
    def get_has_signature(self, obj):
        return obj.has_signature()
from django.contrib.auth import get_user_model
from .field_models import FieldSubmission

User = get_user_model()


class FieldSubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for field submissions (read operations).
    """
    field_agent_name = serializers.CharField(source='field_agent.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    photo_count = serializers.SerializerMethodField()
    has_signature = serializers.SerializerMethodField()
    formatted_notes = serializers.SerializerMethodField()
    
    class Meta:
        model = FieldSubmission
        fields = [
            'id',
            'field_agent',
            'field_agent_name',
            'customer_name',
            'phone',
            'email',
            'address',
            'city',
            'postal_code',
            'property_type',
            'roof_type',
            'roof_condition',
            'roof_age',
            'current_energy_supplier',
            'monthly_bill',
            'heating_type',
            'hot_water_type',
            'insulation_type',
            'windows_type',
            'property_age',
            'occupancy',
            'notes',
            'photos',
            'signature',
            'status',
            'timestamp',
            'reviewed_by',
            'reviewed_by_name',
            'reviewed_at',
            'review_notes',
            'photo_count',
            'has_signature',
            'formatted_notes',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'field_agent',
            'field_agent_name',
            'reviewed_by',
            'reviewed_by_name',
            'reviewed_at',
            'photo_count',
            'has_signature',
            'formatted_notes',
            'created_at',
            'updated_at'
        ]
    
    def get_photo_count(self, obj):
        return obj.get_photo_count()
    
    def get_has_signature(self, obj):
        return obj.has_signature()
    
    def get_formatted_notes(self, obj):
        return obj.get_formatted_notes()


class FieldSubmissionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating field submissions.
    """
    class Meta:
        model = FieldSubmission
        fields = [
            'customer_name',
            'phone',
            'email',
            'address',
            'city',
            'postal_code',
            'property_type',
            'roof_type',
            'roof_condition',
            'roof_age',
            'current_energy_supplier',
            'monthly_bill',
            'heating_type',
            'hot_water_type',
            'insulation_type',
            'windows_type',
            'property_age',
            'occupancy',
            'notes',
            'photos',
            'signature',
            'timestamp'
        ]
    
    def validate_customer_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Customer name is required.")
        return value.strip()
    
    def validate_phone(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Phone number is required.")
        return value.strip()
    
    def validate_address(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Address is required.")
        return value.strip()
    
    def validate_photos(self, value):
        if not value or not isinstance(value, list):
            raise serializers.ValidationError("At least one photo is required.")
        
        if len(value) == 0:
            raise serializers.ValidationError("At least one photo is required.")
        
        # Validate that photos are base64 strings
        for i, photo in enumerate(value):
            if not isinstance(photo, str) or not photo.startswith('data:image/'):
                raise serializers.ValidationError(f"Photo {i+1} must be a valid base64 image.")
        
        return value
    
    def validate_signature(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Customer signature is required.")
        
        if not value.startswith('data:image/'):
            raise serializers.ValidationError("Signature must be a valid base64 image.")
        
        return value
    
    def validate_timestamp(self, value):
        if not value:
            raise serializers.ValidationError("Timestamp is required.")
        return value


class FieldSubmissionUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating field submissions (qualifier review).
    """
    class Meta:
        model = FieldSubmission
        fields = [
            'status',
            'review_notes'
        ]
    
    def validate_status(self, value):
        valid_statuses = ['pending', 'under_review', 'completed', 'rejected']
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(valid_statuses)}")
        return value


class FieldSubmissionListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing field submissions.
    """
    field_agent_name = serializers.CharField(source='field_agent.get_full_name', read_only=True)
    photo_count = serializers.SerializerMethodField()
    has_signature = serializers.SerializerMethodField()
    
    class Meta:
        model = FieldSubmission
        fields = [
            'id',
            'field_agent_name',
            'customer_name',
            'phone',
            'address',
            'city',
            'status',
            'timestamp',
            'photo_count',
            'has_signature',
            'created_at'
        ]
    
    def get_photo_count(self, obj):
        return obj.get_photo_count()
    
    def get_has_signature(self, obj):
        return obj.has_signature()






