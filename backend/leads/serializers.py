from rest_framework import serializers
from .models import Lead, Dialer, LeadNotification, DialerUserLink, Callback, FieldSubmission


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
    assigned_agent_name = serializers.SerializerMethodField()
    assigned_agent_username = serializers.SerializerMethodField()
    field_sales_rep_name = serializers.CharField(source='field_sales_rep.get_full_name', read_only=True, allow_null=True)
    field_sales_rep_username = serializers.CharField(source='field_sales_rep.username', read_only=True, allow_null=True)
    field_submission_data = serializers.SerializerMethodField()
    
    def get_assigned_agent_name(self, obj):
        """Get assigned agent name, using stored name if agent is deleted."""
        # If agent exists, use current name
        if obj.assigned_agent:
            return obj.assigned_agent.get_full_name() or obj.assigned_agent.username
        # If agent is deleted but we have stored name, use that for accountability
        return obj.assigned_agent_name
    
    def get_assigned_agent_username(self, obj):
        """Get assigned agent username, handling null case."""
        return obj.assigned_agent.username if obj.assigned_agent else None
    
    def get_field_submission_data(self, obj):
        """Get field submission data if it exists."""
        if obj.field_submission:
            submission = obj.field_submission
            # Get field values with safe defaults
            def get_field(field_name, default=None):
                # First try to get from model attribute
                value = getattr(submission, field_name, None)
                if value:
                    return value
                # If photos is a dict, check if assessment_data is stored there
                if isinstance(submission.photos, dict) and 'assessment_data' in submission.photos:
                    return submission.photos['assessment_data'].get(field_name, default)
                return default
            
            # Extract from formatted notes if not in model
            # Parse formatted notes to extract key fields
            formatted_notes = submission.get_formatted_notes()
            def extract_from_notes(field_label):
                if not formatted_notes:
                    return None
                lines = formatted_notes.split('\n')
                for line in lines:
                    # Look for lines like "- Owns Property: yes" or "- Age Range: 18-74"
                    if field_label in line and ':' in line:
                        parts = line.split(':')
                        if len(parts) > 1:
                            value = parts[1].strip()
                            # Clean up value (remove £, etc.)
                            value = value.replace('£', '').strip()
                            return value if value and value != 'Not specified' else None
                return None
            
            # Try to get from model attributes first, then from notes parsing
            owns_property = get_field('owns_property') or extract_from_notes('Owns Property')
            is_decision_maker = get_field('is_decision_maker') or extract_from_notes('Decision Maker')
            age_range = get_field('age_range') or extract_from_notes('Age Range')
            electric_bill = get_field('electric_bill') or extract_from_notes('Electric Bill')
            has_received_other_quotes = get_field('has_received_other_quotes') or extract_from_notes('Other Quotes')
            preferred_contact_time = get_field('preferred_contact_time') or extract_from_notes('Preferred Contact')
            
            # Get assessment date/time
            assessment_date = get_field('assessment_date')
            assessment_time = get_field('assessment_time')
            if not assessment_date and submission.timestamp:
                assessment_date = submission.timestamp.strftime('%d/%m/%Y')
            if not assessment_time and submission.timestamp:
                assessment_time = submission.timestamp.strftime('%H:%M')
            
            return {
                'id': submission.id,
                'canvasser_name': getattr(submission.field_agent, 'get_full_name', lambda: getattr(submission.field_agent, 'username', 'Unknown'))(),
                'assessment_date': assessment_date,
                'assessment_time': assessment_time,
                'owns_property': owns_property,
                'is_decision_maker': is_decision_maker,
                'age_range': age_range,
                'electric_bill': electric_bill,
                'has_received_other_quotes': has_received_other_quotes,
                'preferred_contact_time': preferred_contact_time,
                'photos': submission.photos if isinstance(submission.photos, dict) and 'energyBill' in submission.photos else (submission.photos if isinstance(submission.photos, dict) else {}),
                'formatted_notes': formatted_notes,
                'timestamp': submission.timestamp
            }
        return None
    
    class Meta:
        model = Lead
        fields = [
            'id', 'full_name', 'phone', 'email', 'status', 'disposition',
            'assigned_agent', 'assigned_agent_name', 'assigned_agent_username',
            'field_sales_rep', 'field_sales_rep_name', 'field_sales_rep_username',
            'notes', 'qualifier_notes', 'appointment_date', 'qualifier_callback_date', 'google_calendar_event_id', 'sale_amount',
            # Address fields
            'address1', 'city',
            # Dialer-specific fields
            'dialer_lead_id', 'vendor_id', 'list_id', 'gmt_offset_now', 'phone_code',
            'phone_number', 'title', 'first_name', 'middle_initial', 'last_name',
            'postal_code', 'country_code', 'gender', 'date_of_birth', 'alt_phone',
            'security_phrase', 'comments', 'user', 'campaign', 'phone_login',
            'fronter', 'closer', 'group', 'channel_group', 'SQLdate', 'epoch',
            'uniqueid', 'customer_zap_channel', 'server_ip', 'SIPexten', 'session_id',
            'dialed_number', 'dialed_label', 'rank', 'owner', 'camp_script',
            'in_script', 'script_width', 'script_height', 'recording_file',
            # Energy section fields
            'energy_bill_amount', 'has_ev_charger', 'day_night_rate', 
            'has_previous_quotes', 'previous_quotes_details',
            # Contact Information
            'preferred_contact_time',
            # Property Information
            'property_ownership', 'lives_with_partner', 'age_range_18_74', 'moving_within_5_years',
            # Roof and Property Condition
            'loft_conversions', 'velux_windows', 'dormers', 'dormas_shading_windows', 
            'spray_foam_roof', 'building_work_roof',
            # Financial and Employment Status
            'monthly_electricity_spend', 'employment_status', 'debt_management_bankruptcy', 
            'government_grants_aware',
            # Appointment Booking
            'assessment_date_preference', 'assessment_time_preference',
            # Qualifier Lead Sheet Fields
            'desktop_roof_check_completed', 'property_type_qualifier', 'roof_type_qualifier',
            'speaking_to_homeowner', 'both_homeowners_present', 'property_listed',
            'conservation_area', 'building_work_ongoing', 'roof_shaded_obstructed',
            'customer_aware_no_grants', 'current_electric_bill_type', 'customer_age',
            'aged_18_70', 'currently_employed', 'has_good_credit', 'earns_over_12k',
            'planning_to_move_5_years', 'available_3_working_days',
            # Field submission data
            'field_submission_data',
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
    Only full_name, phone, and postal_code are required.
    """
    class Meta:
        model = Lead
        fields = [
            'id', 'full_name', 'phone', 'email', 'address1', 'city', 'postal_code', 'status', 'notes', 
            'appointment_date', 'assigned_agent', 'energy_bill_amount', 'has_ev_charger', 'day_night_rate', 
            'has_previous_quotes', 'previous_quotes_details', 'lead_number',
            # Contact Information
            'preferred_contact_time',
            # Property Information
            'property_ownership', 'lives_with_partner', 'age_range_18_74', 'moving_within_5_years',
            # Roof and Property Condition
            'loft_conversions', 'velux_windows', 'dormers', 'dormas_shading_windows', 
            'spray_foam_roof', 'building_work_roof',
            # Financial and Employment Status
            'monthly_electricity_spend', 'employment_status', 'debt_management_bankruptcy', 
            'government_grants_aware',
            # Appointment Booking
            'assessment_date_preference', 'assessment_time_preference',
        ]
        read_only_fields = ['id', 'is_deleted', 'deleted_at', 'deleted_by', 'deletion_reason', 'assigned_agent', 'lead_number']
        extra_kwargs = {
            'email': {'required': False, 'allow_blank': True},
            'address1': {'required': False, 'allow_blank': True},
            'city': {'required': False, 'allow_blank': True},
            'notes': {'required': False, 'allow_blank': True},
            'appointment_date': {'required': False},
            'energy_bill_amount': {'required': False, 'allow_null': True},
            'has_ev_charger': {'required': False, 'allow_null': True},
            'day_night_rate': {'required': False, 'allow_null': True},
            'has_previous_quotes': {'required': False, 'allow_null': True},
            'previous_quotes_details': {'required': False, 'allow_blank': True},
        }
    
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
            'notes', 'qualifier_notes', 'appointment_date', 'qualifier_callback_date', 'field_sales_rep', 'sale_amount',
            # Address fields
            'address1', 'city', 'postal_code',
            # Energy section fields
            'energy_bill_amount', 'has_ev_charger', 'day_night_rate', 
            'has_previous_quotes', 'previous_quotes_details',
            # Contact Information
            'preferred_contact_time',
            # Property Information
            'property_ownership', 'lives_with_partner', 'age_range_18_74', 'moving_within_5_years',
            # Roof and Property Condition
            'loft_conversions', 'velux_windows', 'dormers', 'dormas_shading_windows', 
            'spray_foam_roof', 'building_work_roof',
            # Financial and Employment Status
            'monthly_electricity_spend', 'employment_status', 'debt_management_bankruptcy', 
            'government_grants_aware',
            # Appointment Booking
            'assessment_date_preference', 'assessment_time_preference',
            # Qualifier Lead Sheet Fields
            'desktop_roof_check_completed', 'property_type_qualifier', 'roof_type_qualifier',
            'speaking_to_homeowner', 'both_homeowners_present', 'property_listed',
            'conservation_area', 'building_work_ongoing', 'roof_shaded_obstructed',
            'customer_aware_no_grants', 'current_electric_bill_type', 'customer_age',
            'aged_18_70', 'currently_employed', 'has_good_credit', 'earns_over_12k',
            'planning_to_move_5_years', 'available_3_working_days',
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
    
    # Form fields (stored in notes)
    preferred_contact_time = serializers.CharField(required=False, allow_blank=True)
    property_ownership = serializers.CharField(required=False, allow_blank=True)
    property_type = serializers.CharField(required=False, allow_blank=True)
    number_of_bedrooms = serializers.CharField(required=False, allow_blank=True)
    roof_type = serializers.CharField(required=False, allow_blank=True)
    roof_material = serializers.CharField(required=False, allow_blank=True)
    average_monthly_electricity_bill = serializers.CharField(required=False, allow_blank=True)
    current_energy_supplier = serializers.CharField(required=False, allow_blank=True)
    electric_heating_appliances = serializers.CharField(required=False, allow_blank=True)
    energy_details = serializers.CharField(required=False, allow_blank=True)
    timeframe = serializers.CharField(required=False, allow_blank=True)
    moving_properties_next_five_years = serializers.CharField(required=False, allow_blank=True)
    timeframe_details = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Lead
        fields = [
            # Core fields
            'full_name', 'phone', 'email', 'notes', 'status',
            # Address fields
            'address1', 'city', 'postal_code',
            # Dialer-specific fields
            'dialer_lead_id', 'vendor_id', 'list_id', 'gmt_offset_now', 'phone_code',
            'phone_number', 'title', 'first_name', 'middle_initial', 'last_name',
            'country_code', 'gender', 'date_of_birth', 'alt_phone',
            'security_phrase', 'comments', 'user', 'campaign', 'phone_login',
            'fronter', 'closer', 'group', 'channel_group', 'SQLdate', 'epoch',
            'uniqueid', 'customer_zap_channel', 'server_ip', 'SIPexten', 'session_id',
            'dialed_number', 'dialed_label', 'rank', 'owner', 'camp_script',
            'in_script', 'script_width', 'script_height', 'recording_file',
            # Energy section fields
            'energy_bill_amount', 'has_ev_charger', 'day_night_rate',
            'has_previous_quotes', 'previous_quotes_details',
            # Form fields (stored in notes)
            'preferred_contact_time', 'property_ownership', 'property_type',
            'number_of_bedrooms', 'roof_type', 'roof_material',
            'average_monthly_electricity_bill', 'current_energy_supplier',
            'electric_heating_appliances', 'energy_details', 'timeframe',
            'moving_properties_next_five_years', 'timeframe_details',
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
        
        # Extract existing notes before modifying validated_data
        existing_notes = validated_data.get('notes', '') or ''
        
        # Extract form fields and format them into notes
        form_fields = {
            'preferred_contact_time': validated_data.pop('preferred_contact_time', None),
            'property_ownership': validated_data.pop('property_ownership', None),
            'property_type': validated_data.pop('property_type', None),
            'number_of_bedrooms': validated_data.pop('number_of_bedrooms', None),
            'roof_type': validated_data.pop('roof_type', None),
            'roof_material': validated_data.pop('roof_material', None),
            'average_monthly_electricity_bill': validated_data.pop('average_monthly_electricity_bill', None),
            'current_energy_supplier': validated_data.pop('current_energy_supplier', None),
            'electric_heating_appliances': validated_data.pop('electric_heating_appliances', None),
            'energy_details': validated_data.pop('energy_details', None),
            'timeframe': validated_data.pop('timeframe', None),
            'moving_properties_next_five_years': validated_data.pop('moving_properties_next_five_years', None),
            'timeframe_details': validated_data.pop('timeframe_details', None),
        }
        
        # Build detailed notes section if any form fields are provided
        detailed_sections = []
        
        # Check if there's already a detailed section
        if '--- DETAILED LEAD INFORMATION ---' not in existing_notes:
            # Build detailed section from form fields
            if any(form_fields.values()):
                detailed_sections.append('\n--- DETAILED LEAD INFORMATION ---\n')
                
                if form_fields['preferred_contact_time']:
                    detailed_sections.append(f'Preferred Contact Time: {form_fields["preferred_contact_time"]}\n')
                if form_fields['property_ownership']:
                    detailed_sections.append(f'Property Ownership: {form_fields["property_ownership"]}\n')
                if form_fields['property_type']:
                    detailed_sections.append(f'Property Type: {form_fields["property_type"]}\n')
                if form_fields['number_of_bedrooms']:
                    detailed_sections.append(f'Number of Bedrooms: {form_fields["number_of_bedrooms"]}\n')
                if form_fields['roof_type']:
                    detailed_sections.append(f'Roof Type: {form_fields["roof_type"]}\n')
                if form_fields['roof_material']:
                    detailed_sections.append(f'Roof Material: {form_fields["roof_material"]}\n')
                if form_fields['average_monthly_electricity_bill']:
                    detailed_sections.append(f'Average Monthly Electricity Bill: {form_fields["average_monthly_electricity_bill"]}\n')
                if validated_data.get('energy_bill_amount'):
                    detailed_sections.append(f'Specific Energy Bill Amount: £{validated_data["energy_bill_amount"]}\n')
                if validated_data.get('has_ev_charger') is not None:
                    ev_status = 'Yes' if validated_data['has_ev_charger'] else 'No'
                    detailed_sections.append(f'Has EV Charger: {ev_status}\n')
                if validated_data.get('day_night_rate'):
                    detailed_sections.append(f'Day/Night Rate: {validated_data["day_night_rate"]}\n')
                if form_fields['current_energy_supplier']:
                    detailed_sections.append(f'Current Energy Supplier: {form_fields["current_energy_supplier"]}\n')
                if form_fields['electric_heating_appliances']:
                    detailed_sections.append(f'Electric Heating/Appliances: {form_fields["electric_heating_appliances"]}\n')
                if form_fields['energy_details']:
                    detailed_sections.append(f'Energy Details: {form_fields["energy_details"]}\n')
                if form_fields['timeframe']:
                    detailed_sections.append(f'Timeframe: {form_fields["timeframe"]}\n')
                if form_fields['moving_properties_next_five_years']:
                    detailed_sections.append(f'Moving Properties Next 5 Years: {form_fields["moving_properties_next_five_years"]}\n')
                if form_fields['timeframe_details']:
                    detailed_sections.append(f'Timeframe Details: {form_fields["timeframe_details"]}\n')
                if validated_data.get('has_previous_quotes') is not None:
                    quotes_status = 'Yes' if validated_data['has_previous_quotes'] else 'No'
                    detailed_sections.append(f'Has Previous Quotes: {quotes_status}\n')
                if validated_data.get('previous_quotes_details'):
                    detailed_sections.append(f'Previous Quotes Details: {validated_data["previous_quotes_details"]}\n')
        
        # Combine notes
        if detailed_sections:
            # Remove any existing detailed section from notes
            notes_parts = existing_notes.split('--- DETAILED LEAD INFORMATION ---')
            base_notes = notes_parts[0].strip() if notes_parts else ''
            validated_data['notes'] = base_notes + ''.join(detailed_sections)
        else:
            validated_data['notes'] = existing_notes
        
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


class FieldSubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for field submissions (read operations).
    """
    field_agent_name = serializers.CharField(source='field_agent.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    photo_count = serializers.SerializerMethodField()
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
            'postal_code',
            'property_type',
            'roof_type',
            'roof_condition',
            'roof_age',
            'current_energy_supplier',
            'average_monthly_bill',
            'energy_type',
            'notes',
            'photos',
            'status',
            'timestamp',
            'reviewed_by',
            'reviewed_by_name',
            'reviewed_at',
            'review_notes',
            'photo_count',
            'formatted_notes',
            'created_at',
            'updated_at',
            # Simplified form fields
            'owns_property',
            'is_decision_maker',
            'age_range',
            'electric_bill',
            'has_received_other_quotes',
            'preferred_contact_time',
            'assessment_date',
            'assessment_time',
            'canvasser_name'
        ]
        read_only_fields = [
            'id',
            'field_agent',
            'field_agent_name',
            'reviewed_by',
            'reviewed_by_name',
            'reviewed_at',
            'photo_count',
            'formatted_notes',
            'created_at',
            'updated_at'
        ]
    
    def get_photo_count(self, obj):
        return obj.get_photo_count()
    
    def get_formatted_notes(self, obj):
        return obj.get_formatted_notes()


class FieldSubmissionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating field submissions.
    """
    class Meta:
        model = FieldSubmission
        fields = [
            'canvasser_name',
            'assessment_date',
            'assessment_time',
            'customer_name',
            'phone',
            'email',
            'address',
            'postal_code',
            'preferred_contact_time',
            'owns_property',
            'is_decision_maker',
            'age_range',
            'electric_bill',
            'has_received_other_quotes',
            'property_type',
            'number_of_bedrooms',
            'roof_type',
            'roof_material',
            'roof_condition',
            'roof_age',
            'current_energy_supplier',
            'average_monthly_bill',
            'energy_type',
            'uses_electric_heating',
            'electric_heating_details',
            'moving_in_5_years',
            'notes',
            'photos',
            'timestamp'
        ]
    
    def to_internal_value(self, data):
        """Convert empty strings to None for optional fields."""
        # Convert empty strings to None for optional simplified form fields
        optional_fields = [
            'owns_property', 'is_decision_maker', 'age_range', 'electric_bill',
            'has_received_other_quotes', 'preferred_contact_time',
            'assessment_date', 'assessment_time', 'canvasser_name'
        ]
        for field in optional_fields:
            if field in data and data[field] == '':
                data[field] = None
        return super().to_internal_value(data)
    
    def validate_customer_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Customer name is required.")
        return value.strip()
    
    def validate_phone(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Phone number is required.")
        return value.strip()
    
    def validate_address(self, value):
        # Address is required for field submissions, but provide default for legacy offline submissions
        if not value or not value.strip():
            return "Address not provided"  # Provide default instead of raising error
        return value.strip()
    
    def validate_photos(self, value):
        # Photos are optional - accept dict or list format
        if not value:
            return {}  # Return empty dict if no photos
        # Accept both dict {roof, frontRear, energyBill} or list format
        return value
    
    def validate_timestamp(self, value):
        if not value:
            raise serializers.ValidationError("Timestamp is required.")
        return value


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

        return value

