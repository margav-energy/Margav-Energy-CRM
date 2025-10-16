from rest_framework import serializers
from .models import Lead, Dialer, LeadNotification, DialerUserLink, Callback


class DialerSerializer(serializers.ModelSerializer):
    """
    Serializer for Dialer model.
    """
    class Meta:
        model = Dialer
        fields = ['id', 'is_active', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class LeadNotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for LeadNotification model.
    """
    lead_name = serializers.CharField(source='lead.full_name', read_only=True)
    lead_phone = serializers.CharField(source='lead.phone', read_only=True)
    qualifier_name = serializers.CharField(source='qualifier.get_full_name', read_only=True)
    
    class Meta:
        model = LeadNotification
        fields = [
            'id', 'lead', 'lead_name', 'lead_phone', 'agent', 'qualifier', 
            'qualifier_name', 'message', 'notification_type', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LeadSerializer(serializers.ModelSerializer):
    """
    Serializer for Lead model.
    """
    assigned_agent_name = serializers.CharField(source='assigned_agent.get_full_name', read_only=True)
    assigned_agent_username = serializers.CharField(source='assigned_agent.username', read_only=True)
    field_sales_rep_name = serializers.CharField(source='field_sales_rep.get_full_name', read_only=True)
    field_sales_rep_username = serializers.CharField(source='field_sales_rep.username', read_only=True)
    
    class Meta:
        model = Lead
        fields = [
            'id', 'full_name', 'phone', 'email', 'status', 'disposition',
            'assigned_agent', 'assigned_agent_name', 'assigned_agent_username',
            'field_sales_rep', 'field_sales_rep_name', 'field_sales_rep_username',
            'notes', 'appointment_date', 'google_calendar_event_id', 'sale_amount',
            # Dialer-specific fields
            'dialer_lead_id', 'vendor_id', 'list_id', 'gmt_offset_now', 'phone_code',
            'phone_number', 'title', 'first_name', 'middle_initial', 'last_name',
            'address1', 'address2', 'address3', 'city', 'state', 'province',
            'postal_code', 'country_code', 'gender', 'date_of_birth', 'alt_phone',
            'security_phrase', 'comments', 'user', 'campaign', 'phone_login',
            'fronter', 'closer', 'group', 'channel_group', 'SQLdate', 'epoch',
            'uniqueid', 'customer_zap_channel', 'server_ip', 'SIPexten', 'session_id',
            'dialed_number', 'dialed_label', 'rank', 'owner', 'camp_script',
            'in_script', 'script_width', 'script_height', 'recording_file',
            # Energy section fields
            'energy_bill_amount', 'has_ev_charger', 'day_night_rate', 
            'has_previous_quotes', 'previous_quotes_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'assigned_agent_name', 'assigned_agent_username',
            'field_sales_rep_name', 'field_sales_rep_username',
            'created_at', 'updated_at'
        ]


class LeadCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new leads.
    """
    class Meta:
        model = Lead
        fields = ['id', 'full_name', 'phone', 'email', 'address1', 'city', 'postal_code', 'status', 'notes', 'appointment_date', 'assigned_agent', 'energy_bill_amount', 'has_ev_charger', 'day_night_rate', 'has_previous_quotes', 'previous_quotes_details', 'lead_number']
        read_only_fields = ['id', 'is_deleted', 'deleted_at', 'deleted_by', 'deletion_reason', 'assigned_agent', 'lead_number']
    
    def validate(self, data):
        return super().validate(data)
    
    def validate_phone(self, value):
        """
        Validate that the phone number is unique.
        """
        # Check for existing leads with this phone number (including soft-deleted ones)
        existing_leads = Lead.objects.filter(phone=value)
        if existing_leads.exists():
            existing_lead = existing_leads.first()
            raise serializers.ValidationError(f"A lead with this phone number already exists (Lead ID: {existing_lead.id}, Name: {existing_lead.full_name}).")
        return value
    
    def create(self, validated_data):
        # Always assign the lead to the current user (agents can only create leads for themselves)
        validated_data['assigned_agent'] = self.context['request'].user
        
        # Try to create the lead with retry mechanism for lead number conflicts
        max_retries = 5
        for attempt in range(max_retries):
            try:
                # Generate lead number before creating the lead
                temp_lead = Lead(**validated_data)
                validated_data['lead_number'] = temp_lead.generate_lead_number()
                
                # Debug: Print validated data
                
                lead = Lead.objects.create(**validated_data)
                return lead
                
            except Exception as e:
                
                # Check if it's a duplicate phone number error
                if 'unique_phone_per_lead' in str(e):
                    # Find the existing lead with this phone number
                    existing_lead = Lead.objects.filter(phone=validated_data['phone']).first()
                    if existing_lead:
                        raise serializers.ValidationError({
                            'phone': f"A lead with this phone number already exists (Lead ID: {existing_lead.id}, Name: {existing_lead.full_name})."
                        })
                    else:
                        raise serializers.ValidationError({
                            'phone': "A lead with this phone number already exists."
                        })
                
                # Check if it's a duplicate lead number error
                elif 'leads_lead_lead_number_key' in str(e):
                    if attempt < max_retries - 1:
                        # Remove the lead_number from validated_data and try again
                        validated_data.pop('lead_number', None)
                        continue
                    else:
                        raise serializers.ValidationError({
                            'non_field_errors': ["Unable to create lead due to a temporary system issue. Please try again."]
                        })
                else:
                    raise e
        
        # This should never be reached, but just in case
        raise serializers.ValidationError({
            'non_field_errors': ["Unable to create lead due to a temporary system issue. Please try again."]
        })


class LeadUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating leads.
    """
    class Meta:
        model = Lead
        fields = [
            'full_name', 'phone', 'email', 'status', 'disposition', 
            'notes', 'appointment_date', 'field_sales_rep', 'sale_amount',
            # Energy section fields
            'energy_bill_amount', 'has_ev_charger', 'day_night_rate', 
            'has_previous_quotes', 'previous_quotes_details'
        ]


class LeadDispositionSerializer(serializers.ModelSerializer):
    """
    Serializer for updating lead disposition.
    """
    class Meta:
        model = Lead
        fields = ['status', 'disposition', 'notes']


class DialerLeadSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating leads from dialer system.
    Handles comprehensive dialer data.
    """
    dialer_user_id = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Lead
        fields = [
            # Core fields
            'full_name', 'phone', 'email', 'notes', 'status',
            # Dialer-specific fields
            'dialer_lead_id', 'vendor_id', 'list_id', 'gmt_offset_now', 'phone_code',
            'phone_number', 'title', 'first_name', 'middle_initial', 'last_name',
            'address1', 'address2', 'address3', 'city', 'state', 'province',
            'postal_code', 'country_code', 'gender', 'date_of_birth', 'alt_phone',
            'security_phrase', 'comments', 'user', 'campaign', 'phone_login',
            'fronter', 'closer', 'group', 'channel_group', 'SQLdate', 'epoch',
            'uniqueid', 'customer_zap_channel', 'server_ip', 'SIPexten', 'session_id',
            'dialed_number', 'dialed_label', 'rank', 'owner', 'camp_script',
            'in_script', 'script_width', 'script_height', 'recording_file',
            # Mapping field
            'dialer_user_id'
        ]
        extra_kwargs = {
            'full_name': {'required': False},
            'phone': {'required': False},
            'email': {'required': False},
            'notes': {'required': False},
        }
    
    def validate_dialer_lead_id(self, value):
        """
        Validate dialer_lead_id uniqueness.
        """
        if value and Lead.objects.filter(dialer_lead_id=value).exists():
            existing_lead = Lead.objects.filter(dialer_lead_id=value).first()
            raise serializers.ValidationError(f"A lead with this dialer ID already exists (Lead ID: {existing_lead.id}, Name: {existing_lead.full_name}).")
        return value
    
    def validate_phone(self, value):
        """
        Validate phone number uniqueness.
        """
        if value and Lead.objects.filter(phone=value).exists():
            existing_lead = Lead.objects.filter(phone=value).first()
            raise serializers.ValidationError(f"A lead with this phone number already exists (Lead ID: {existing_lead.id}, Name: {existing_lead.full_name}).")
        return value
    
    def create(self, validated_data):
        """
        Create a new lead from dialer data.
        """
        # Set default status
        validated_data['status'] = validated_data.get('status', 'interested')
        
        # Build full_name from components if not provided
        if not validated_data.get('full_name'):
            first_name = validated_data.get('first_name', '')
            middle_initial = validated_data.get('middle_initial', '')
            last_name = validated_data.get('last_name', '')
            
            name_parts = [first_name]
            if middle_initial:
                name_parts.append(middle_initial)
            if last_name:
                name_parts.append(last_name)
            
            validated_data['full_name'] = ' '.join(name_parts).strip()
        
        # Use phone_number if phone is not provided
        if not validated_data.get('phone') and validated_data.get('phone_number'):
            validated_data['phone'] = validated_data['phone_number']
        
        # Resolve agent using dialer_user_id mapping first; fallback to username
        from django.contrib.auth import get_user_model
        User = get_user_model()

        dialer_user_id = validated_data.pop('dialer_user_id', None)
        user_field = validated_data.get('user')

        agent = None
        if dialer_user_id:
            link = DialerUserLink.objects.filter(dialer_user_id=dialer_user_id).select_related('crm_user').first()
            if link:
                agent = link.crm_user
        if agent is None and user_field:
            try:
                agent = User.objects.get(username=user_field)
            except User.DoesNotExist:
                pass
        if agent is None:
            raise serializers.ValidationError("Agent mapping not found. Provide a valid dialer_user_id or username.")

        validated_data['assigned_agent'] = agent
        
        return Lead.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        """
        Update existing lead from dialer data.
        """
        # Update all fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class CallbackSerializer(serializers.ModelSerializer):
    """
    Serializer for Callback model.
    """
    lead_name = serializers.SerializerMethodField()
    lead_phone = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    
    def get_lead_name(self, obj):
        try:
            return obj.lead.full_name if obj.lead else 'Unknown Lead'
        except:
            return 'Unknown Lead'
    
    def get_lead_phone(self, obj):
        try:
            return obj.lead.phone if obj.lead else 'Unknown Phone'
        except:
            return 'Unknown Phone'
    
    def get_created_by_name(self, obj):
        try:
            return obj.created_by.get_full_name() if obj.created_by else 'Unknown User'
        except:
            return 'Unknown User'
    
    class Meta:
        model = Callback
        fields = [
            'id', 'lead', 'lead_name', 'lead_phone', 'scheduled_time', 'status', 
            'notes', 'created_by', 'created_by_name', 'completed_at', 'is_due', 'is_overdue'
        ]
        read_only_fields = ['id', 'created_by', 'completed_at', 'is_due', 'is_overdue']
    
    def create(self, validated_data):
        # Always assign the callback to the current user
        validated_data['created_by'] = self.context['request'].user
        return Callback.objects.create(**validated_data)


class CallbackCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new callbacks.
    """
    class Meta:
        model = Callback
        fields = ['lead', 'scheduled_time', 'notes']
    
    def create(self, validated_data):
        # Always assign the callback to the current user
        validated_data['created_by'] = self.context['request'].user
        return Callback.objects.create(**validated_data)

