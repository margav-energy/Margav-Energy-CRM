from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Lead, FieldSubmission
from .serializers import FieldSubmissionSerializer, FieldSubmissionCreateSerializer
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class FieldSubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for field submissions with offline sync support.
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FieldSubmissionCreateSerializer
        return FieldSubmissionSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Admins and qualifiers can see all submissions
        if user.is_admin or user.is_qualifier:
            return FieldSubmission.objects.all()
        
        # Canvassers and salesreps can only see their own submissions
        if user.is_canvasser or user.is_salesrep:
            return FieldSubmission.objects.filter(field_agent=user)
        
        return FieldSubmission.objects.none()
    
    def create(self, request, *args, **kwargs):
        """
        Create a new field submission and automatically create a lead for qualifier review.
        """
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Set the field agent
        submission_data = serializer.validated_data.copy()
        submission_data['field_agent'] = request.user
        
        # Create the field submission
        submission = serializer.save(**submission_data)
        
        # Automatically create a lead for qualifier review
        # Use the canvasser as the assigned agent initially
        
        # Parse city from address if it follows the format "Street, City, Postcode"
        parsed_city = ''
        if submission.address:
            address_parts = submission.address.split(',')
            if len(address_parts) >= 2:
                # Take the second part as city (index 1)
                parsed_city = address_parts[1].strip()
        
        lead_data = {
            'full_name': submission.customer_name,
            'phone': submission.phone,
            'email': submission.email or '',
            'address1': submission.address,
            'city': parsed_city,  # Extract city from address
            'postal_code': submission.postal_code,
            'notes': self._format_submission_notes(submission),
            'status': 'sent_to_kelly',  # Send directly to qualifier
            'assigned_agent': submission.field_agent,  # Assign to the canvasser who submitted
            'field_submission': submission,
            'created_at': submission.timestamp,
            'updated_at': submission.timestamp
        }
        
        try:
            lead = Lead.objects.create(**lead_data)
            logger.info(f"Created lead {lead.id} from field submission {submission.id}")
        except Exception as e:
            logger.error(f"Error creating lead from field submission: {e}")
            # Don't fail the submission if lead creation fails
        
        # Return the submission data
        response_serializer = FieldSubmissionSerializer(submission)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """
        Update an existing field submission and update the associated lead.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Update the field submission
        submission = serializer.save()
        
        # Update or create the associated lead
        # Parse city from address if it follows the format "Street, City, Postcode"
        parsed_city = ''
        if submission.address:
            address_parts = submission.address.split(',')
            if len(address_parts) >= 2:
                # Take the second part as city (index 1)
                parsed_city = address_parts[1].strip()
        
        # Check if a lead already exists for this submission
        existing_lead = None
        try:
            existing_lead = Lead.objects.get(field_submission=submission)
        except Lead.DoesNotExist:
            pass
        
        lead_data = {
            'full_name': submission.customer_name,
            'phone': submission.phone,
            'email': submission.email or '',
            'address1': submission.address,
            'city': parsed_city,
            'postal_code': submission.postal_code,
            'notes': self._format_submission_notes(submission),
            'assigned_agent': submission.field_agent,
            'field_submission': submission,
        }
        
        try:
            if existing_lead:
                # Update existing lead but preserve status if it's been changed by qualifier
                # Only update status to 'sent_to_kelly' if it's still 'sent_to_kelly'
                # This prevents overwriting status changes made by qualifiers
                current_status = existing_lead.status
                for key, value in lead_data.items():
                    setattr(existing_lead, key, value)
                # Preserve status if qualifier has changed it from 'sent_to_kelly'
                if current_status != 'sent_to_kelly':
                    existing_lead.status = current_status
                existing_lead.updated_at = timezone.now()
                existing_lead.save()
                logger.info(f"Updated lead {existing_lead.id} from field submission {submission.id}")
            else:
                # Create new lead if it doesn't exist (edge case)
                lead_data['status'] = 'sent_to_kelly'
                lead_data['created_at'] = submission.timestamp
                lead_data['updated_at'] = submission.timestamp
                lead = Lead.objects.create(**lead_data)
                logger.info(f"Created lead {lead.id} from updated field submission {submission.id}")
        except Exception as e:
            logger.error(f"Error updating/creating lead from field submission: {e}")
            # Don't fail the submission update if lead update fails
        
        # Return the updated submission data
        response_serializer = FieldSubmissionSerializer(submission)
        return Response(response_serializer.data)
    
    def _format_submission_notes(self, submission):
        """Format field submission data into notes for the lead."""
        notes = f"Canvas Team Assessment by {submission.canvasser_name}\n"
        notes += f"Date: {submission.assessment_date} at {submission.assessment_time}\n\n"
        
        # Property Information
        notes += "PROPERTY INFORMATION:\n"
        notes += f"Owns Property: {submission.owns_property or 'Not specified'}\n"
        notes += f"Property Type: {submission.property_type or 'Not specified'}\n"
        notes += f"Number of Bedrooms: {submission.number_of_bedrooms or 'Not specified'}\n"
        notes += f"Roof Type: {submission.roof_type or 'Not specified'}\n"
        notes += f"Roof Material: {submission.roof_material or 'Not specified'}\n"
        notes += f"Roof Condition: {submission.roof_condition or 'Not specified'}\n"
        notes += f"Roof Age: {submission.roof_age or 'Not specified'}\n\n"
        
        # Energy Usage
        notes += "ENERGY USAGE:\n"
        notes += f"Current Supplier: {submission.current_energy_supplier or 'Not specified'}\n"
        notes += f"Average Monthly Bill: £{submission.average_monthly_bill or 'Not specified'}\n"
        notes += f"Energy Type: {submission.energy_type or 'Not specified'}\n"
        notes += f"Uses Electric Heating: {submission.uses_electric_heating or 'Not specified'}\n"
        if submission.electric_heating_details:
            notes += f"Electric Heating Details: {submission.electric_heating_details}\n"
        notes += "\n"
        
        # Timeframe and Interest
        notes += "CUSTOMER INTEREST:\n"
        notes += f"Has Received Other Quotes: {submission.has_received_other_quotes or 'Not specified'}\n"
        notes += f"Is Decision Maker: {submission.is_decision_maker or 'Not specified'}\n"
        notes += f"Moving in 5 Years: {submission.moving_in_5_years or 'Not specified'}\n\n"
        
        # Preferred Contact Time
        notes += f"Preferred Contact Time: {submission.preferred_contact_time or 'Not specified'}\n\n"
        
        # Additional Notes
        if submission.notes:
            notes += f"ADDITIONAL NOTES:\n{submission.notes}\n\n"
        
        # Photos and Signature
        photo_count = 0
        if isinstance(submission.photos, dict):
            photo_count = sum(1 for v in submission.photos.values() if v)
        elif isinstance(submission.photos, list):
            photo_count = len(submission.photos)
        
        notes += f"Photos: {photo_count} captured\n"
        
        return notes


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def field_submission_stats(request):
    """
    Get statistics for field submissions.
    """
    user = request.user
    
    if user.is_admin or user.is_qualifier:
        total_submissions = FieldSubmission.objects.count()
        pending_review = FieldSubmission.objects.filter(status='pending').count()
        completed_review = FieldSubmission.objects.filter(status='completed').count()
    elif user.is_canvasser or user.is_salesrep:
        total_submissions = FieldSubmission.objects.filter(field_agent=user).count()
        pending_review = FieldSubmission.objects.filter(field_agent=user, status='pending').count()
        completed_review = FieldSubmission.objects.filter(field_agent=user, status='completed').count()
    else:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    return Response({
        'total_submissions': total_submissions,
        'pending_review': pending_review,
        'completed_review': completed_review
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_sync_field_submissions(request):
    """
    Bulk sync multiple field submissions (for offline sync).
    """
    submissions_data = request.data.get('submissions', [])
    
    if not submissions_data:
        return Response({'error': 'No submissions provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    created_count = 0
    failed_count = 0
    failed_submissions = []
    
    for submission_data in submissions_data:
        try:
            # Validate required fields
            required_fields = ['customer_name', 'phone', 'address', 'timestamp']
            missing_fields = [field for field in required_fields if not submission_data.get(field)]
            
            if missing_fields:
                failed_submissions.append({
                    'data': submission_data,
                    'error': f"Missing required fields: {', '.join(missing_fields)}"
                })
                failed_count += 1
                continue
            
            # Create field submission
            submission = FieldSubmission.objects.create(
                field_agent=request.user,
                customer_name=submission_data['customer_name'],
                phone=submission_data['phone'],
                email=submission_data.get('email', ''),
                address=submission_data['address'],
                city=submission_data.get('city', ''),
                postal_code=submission_data.get('postal_code', ''),
                property_type=submission_data.get('property_type', ''),
                roof_type=submission_data.get('roof_type', ''),
                roof_condition=submission_data.get('roof_condition', ''),
                roof_age=submission_data.get('roof_age', ''),
                current_energy_supplier=submission_data.get('current_energy_supplier', ''),
                monthly_bill=submission_data.get('monthly_bill', ''),
                heating_type=submission_data.get('heating_type', ''),
                hot_water_type=submission_data.get('hot_water_type', ''),
                insulation_type=submission_data.get('insulation_type', ''),
                windows_type=submission_data.get('windows_type', ''),
                property_age=submission_data.get('property_age', ''),
                occupancy=submission_data.get('occupancy', ''),
                notes=submission_data.get('notes', ''),
                photos=submission_data.get('photos', []),
                signature=submission_data.get('signature', ''),
                timestamp=submission_data['timestamp'],
                status='pending'
            )
            
            # Create lead for qualifier review
            lead_data = {
                'full_name': submission.customer_name,
                'phone': submission.phone,
                'email': submission.email,
                'address1': submission.address,
                'city': submission.city,
                'postal_code': submission.postal_code,
                'notes': f"Field Assessment - {submission.timestamp.strftime('%Y-%m-%d %H:%M')}\n\nProperty Type: {submission.property_type or 'Not specified'}\nRoof Type: {submission.roof_type or 'Not specified'}\nRoof Condition: {submission.roof_condition or 'Not specified'}\nRoof Age: {submission.roof_age or 'Not specified'}\nCurrent Energy Supplier: {submission.current_energy_supplier or 'Not specified'}\nMonthly Bill: {submission.monthly_bill or 'Not specified'}\nHeating Type: {submission.heating_type or 'Not specified'}\nHot Water Type: {submission.hot_water_type or 'Not specified'}\nInsulation Type: {submission.insulation_type or 'Not specified'}\nWindows Type: {submission.windows_type or 'Not specified'}\nProperty Age: {submission.property_age or 'Not specified'}\nOccupancy: {submission.occupancy or 'Not specified'}\n\nAdditional Notes:\n{submission.notes or 'None'}\n\nPhotos: {len(submission.photos)} taken\n",
                'status': 'sent_to_kelly',
                'assigned_agent': None,
                'field_submission': submission,
                'created_at': submission.timestamp,
                'updated_at': submission.timestamp
            }
            
            lead = Lead.objects.create(**lead_data)
            created_count += 1
            
        except Exception as e:
            failed_submissions.append({
                'data': submission_data,
                'error': str(e)
            })
            failed_count += 1
    
    return Response({
        'message': f'Processed {len(submissions_data)} submissions',
        'created_count': created_count,
        'failed_count': failed_count,
        'failed_submissions': failed_submissions
    }, status=status.HTTP_201_CREATED)

from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Lead, FieldSubmission
from .serializers import FieldSubmissionSerializer, FieldSubmissionCreateSerializer
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class FieldSubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for field submissions with offline sync support.
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FieldSubmissionCreateSerializer
        return FieldSubmissionSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Admins and qualifiers can see all submissions
        if user.is_admin or user.is_qualifier:
            return FieldSubmission.objects.all()
        
        # Canvassers and salesreps can only see their own submissions
        if user.is_canvasser or user.is_salesrep:
            return FieldSubmission.objects.filter(field_agent=user)
        
        return FieldSubmission.objects.none()
    
    def create(self, request, *args, **kwargs):
        """
        Create a new field submission and automatically create a lead for qualifier review.
        """
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Set the field agent
        submission_data = serializer.validated_data.copy()
        submission_data['field_agent'] = request.user
        
        # Create the field submission
        submission = serializer.save(**submission_data)
        
        # Automatically create a lead for qualifier review
        # Use the canvasser as the assigned agent initially
        
        # Parse city from address if it follows the format "Street, City, Postcode"
        parsed_city = ''
        if submission.address:
            address_parts = submission.address.split(',')
            if len(address_parts) >= 2:
                # Take the second part as city (index 1)
                parsed_city = address_parts[1].strip()
        
        lead_data = {
            'full_name': submission.customer_name,
            'phone': submission.phone,
            'email': submission.email or '',
            'address1': submission.address,
            'city': parsed_city,  # Extract city from address
            'postal_code': submission.postal_code,
            'notes': self._format_submission_notes(submission),
            'status': 'sent_to_kelly',  # Send directly to qualifier
            'assigned_agent': submission.field_agent,  # Assign to the canvasser who submitted
            'field_submission': submission,
            'created_at': submission.timestamp,
            'updated_at': submission.timestamp
        }
        
        try:
            lead = Lead.objects.create(**lead_data)
            logger.info(f"Created lead {lead.id} from field submission {submission.id}")
        except Exception as e:
            logger.error(f"Error creating lead from field submission: {e}")
            # Don't fail the submission if lead creation fails
        
        # Return the submission data
        response_serializer = FieldSubmissionSerializer(submission)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """
        Update an existing field submission and update the associated lead.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Update the field submission
        submission = serializer.save()
        
        # Update or create the associated lead
        # Parse city from address if it follows the format "Street, City, Postcode"
        parsed_city = ''
        if submission.address:
            address_parts = submission.address.split(',')
            if len(address_parts) >= 2:
                # Take the second part as city (index 1)
                parsed_city = address_parts[1].strip()
        
        # Check if a lead already exists for this submission
        existing_lead = None
        try:
            existing_lead = Lead.objects.get(field_submission=submission)
        except Lead.DoesNotExist:
            pass
        
        lead_data = {
            'full_name': submission.customer_name,
            'phone': submission.phone,
            'email': submission.email or '',
            'address1': submission.address,
            'city': parsed_city,
            'postal_code': submission.postal_code,
            'notes': self._format_submission_notes(submission),
            'assigned_agent': submission.field_agent,
            'field_submission': submission,
        }
        
        try:
            if existing_lead:
                # Update existing lead but preserve status if it's been changed by qualifier
                # Only update status to 'sent_to_kelly' if it's still 'sent_to_kelly'
                # This prevents overwriting status changes made by qualifiers
                current_status = existing_lead.status
                for key, value in lead_data.items():
                    setattr(existing_lead, key, value)
                # Preserve status if qualifier has changed it from 'sent_to_kelly'
                if current_status != 'sent_to_kelly':
                    existing_lead.status = current_status
                existing_lead.updated_at = timezone.now()
                existing_lead.save()
                logger.info(f"Updated lead {existing_lead.id} from field submission {submission.id}")
            else:
                # Create new lead if it doesn't exist (edge case)
                lead_data['status'] = 'sent_to_kelly'
                lead_data['created_at'] = submission.timestamp
                lead_data['updated_at'] = submission.timestamp
                lead = Lead.objects.create(**lead_data)
                logger.info(f"Created lead {lead.id} from updated field submission {submission.id}")
        except Exception as e:
            logger.error(f"Error updating/creating lead from field submission: {e}")
            # Don't fail the submission update if lead update fails
        
        # Return the updated submission data
        response_serializer = FieldSubmissionSerializer(submission)
        return Response(response_serializer.data)
    
    def _format_submission_notes(self, submission):
        """Format field submission data into notes for the lead."""
        notes = f"Canvas Team Assessment by {submission.canvasser_name}\n"
        notes += f"Date: {submission.assessment_date} at {submission.assessment_time}\n\n"
        
        # Property Information
        notes += "PROPERTY INFORMATION:\n"
        notes += f"Owns Property: {submission.owns_property or 'Not specified'}\n"
        notes += f"Property Type: {submission.property_type or 'Not specified'}\n"
        notes += f"Number of Bedrooms: {submission.number_of_bedrooms or 'Not specified'}\n"
        notes += f"Roof Type: {submission.roof_type or 'Not specified'}\n"
        notes += f"Roof Material: {submission.roof_material or 'Not specified'}\n"
        notes += f"Roof Condition: {submission.roof_condition or 'Not specified'}\n"
        notes += f"Roof Age: {submission.roof_age or 'Not specified'}\n\n"
        
        # Energy Usage
        notes += "ENERGY USAGE:\n"
        notes += f"Current Supplier: {submission.current_energy_supplier or 'Not specified'}\n"
        notes += f"Average Monthly Bill: £{submission.average_monthly_bill or 'Not specified'}\n"
        notes += f"Energy Type: {submission.energy_type or 'Not specified'}\n"
        notes += f"Uses Electric Heating: {submission.uses_electric_heating or 'Not specified'}\n"
        if submission.electric_heating_details:
            notes += f"Electric Heating Details: {submission.electric_heating_details}\n"
        notes += "\n"
        
        # Timeframe and Interest
        notes += "CUSTOMER INTEREST:\n"
        notes += f"Has Received Other Quotes: {submission.has_received_other_quotes or 'Not specified'}\n"
        notes += f"Is Decision Maker: {submission.is_decision_maker or 'Not specified'}\n"
        notes += f"Moving in 5 Years: {submission.moving_in_5_years or 'Not specified'}\n\n"
        
        # Preferred Contact Time
        notes += f"Preferred Contact Time: {submission.preferred_contact_time or 'Not specified'}\n\n"
        
        # Additional Notes
        if submission.notes:
            notes += f"ADDITIONAL NOTES:\n{submission.notes}\n\n"
        
        # Photos and Signature
        photo_count = 0
        if isinstance(submission.photos, dict):
            photo_count = sum(1 for v in submission.photos.values() if v)
        elif isinstance(submission.photos, list):
            photo_count = len(submission.photos)
        
        notes += f"Photos: {photo_count} captured\n"
        
        return notes


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def field_submission_stats(request):
    """
    Get statistics for field submissions.
    """
    user = request.user
    
    if user.is_admin or user.is_qualifier:
        total_submissions = FieldSubmission.objects.count()
        pending_review = FieldSubmission.objects.filter(status='pending').count()
        completed_review = FieldSubmission.objects.filter(status='completed').count()
    elif user.is_canvasser or user.is_salesrep:
        total_submissions = FieldSubmission.objects.filter(field_agent=user).count()
        pending_review = FieldSubmission.objects.filter(field_agent=user, status='pending').count()
        completed_review = FieldSubmission.objects.filter(field_agent=user, status='completed').count()
    else:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    return Response({
        'total_submissions': total_submissions,
        'pending_review': pending_review,
        'completed_review': completed_review
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_sync_field_submissions(request):
    """
    Bulk sync multiple field submissions (for offline sync).
    """
    submissions_data = request.data.get('submissions', [])
    
    if not submissions_data:
        return Response({'error': 'No submissions provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    created_count = 0
    failed_count = 0
    failed_submissions = []
    
    for submission_data in submissions_data:
        try:
            # Validate required fields
            required_fields = ['customer_name', 'phone', 'address', 'timestamp']
            missing_fields = [field for field in required_fields if not submission_data.get(field)]
            
            if missing_fields:
                failed_submissions.append({
                    'data': submission_data,
                    'error': f"Missing required fields: {', '.join(missing_fields)}"
                })
                failed_count += 1
                continue
            
            # Create field submission
            submission = FieldSubmission.objects.create(
                field_agent=request.user,
                customer_name=submission_data['customer_name'],
                phone=submission_data['phone'],
                email=submission_data.get('email', ''),
                address=submission_data['address'],
                city=submission_data.get('city', ''),
                postal_code=submission_data.get('postal_code', ''),
                property_type=submission_data.get('property_type', ''),
                roof_type=submission_data.get('roof_type', ''),
                roof_condition=submission_data.get('roof_condition', ''),
                roof_age=submission_data.get('roof_age', ''),
                current_energy_supplier=submission_data.get('current_energy_supplier', ''),
                monthly_bill=submission_data.get('monthly_bill', ''),
                heating_type=submission_data.get('heating_type', ''),
                hot_water_type=submission_data.get('hot_water_type', ''),
                insulation_type=submission_data.get('insulation_type', ''),
                windows_type=submission_data.get('windows_type', ''),
                property_age=submission_data.get('property_age', ''),
                occupancy=submission_data.get('occupancy', ''),
                notes=submission_data.get('notes', ''),
                photos=submission_data.get('photos', []),
                signature=submission_data.get('signature', ''),
                timestamp=submission_data['timestamp'],
                status='pending'
            )
            
            # Create lead for qualifier review
            lead_data = {
                'full_name': submission.customer_name,
                'phone': submission.phone,
                'email': submission.email,
                'address1': submission.address,
                'city': submission.city,
                'postal_code': submission.postal_code,
                'notes': f"Field Assessment - {submission.timestamp.strftime('%Y-%m-%d %H:%M')}\n\nProperty Type: {submission.property_type or 'Not specified'}\nRoof Type: {submission.roof_type or 'Not specified'}\nRoof Condition: {submission.roof_condition or 'Not specified'}\nRoof Age: {submission.roof_age or 'Not specified'}\nCurrent Energy Supplier: {submission.current_energy_supplier or 'Not specified'}\nMonthly Bill: {submission.monthly_bill or 'Not specified'}\nHeating Type: {submission.heating_type or 'Not specified'}\nHot Water Type: {submission.hot_water_type or 'Not specified'}\nInsulation Type: {submission.insulation_type or 'Not specified'}\nWindows Type: {submission.windows_type or 'Not specified'}\nProperty Age: {submission.property_age or 'Not specified'}\nOccupancy: {submission.occupancy or 'Not specified'}\n\nAdditional Notes:\n{submission.notes or 'None'}\n\nPhotos: {len(submission.photos)} taken\n",
                'status': 'sent_to_kelly',
                'assigned_agent': None,
                'field_submission': submission,
                'created_at': submission.timestamp,
                'updated_at': submission.timestamp
            }
            
            lead = Lead.objects.create(**lead_data)
            created_count += 1
            
        except Exception as e:
            failed_submissions.append({
                'data': submission_data,
                'error': str(e)
            })
            failed_count += 1
    
    return Response({
        'message': f'Processed {len(submissions_data)} submissions',
        'created_count': created_count,
        'failed_count': failed_count,
        'failed_submissions': failed_submissions
    }, status=status.HTTP_201_CREATED)
