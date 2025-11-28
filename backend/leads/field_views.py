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
        elif self.request.method in ['PUT', 'PATCH']:
            # Use create serializer for updates so we can write to all fields
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
        # The serializer will handle all fields including the new simplified form fields
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
        
        # Check if a lead already exists for this submission or phone number
        existing_lead = None
        try:
            # First, try to find by field_submission (most reliable)
            existing_lead = Lead.objects.filter(field_submission=submission).first()
            if not existing_lead and submission.phone:
                # If not found by submission, check by phone number
                existing_lead = Lead.objects.filter(phone=submission.phone).first()
        except Exception as e:
            logger.warning(f"Error checking for existing lead: {e}")
        
        lead_data = {
            'full_name': submission.customer_name,
            'phone': submission.phone,
            'email': submission.email or '',
            'address1': submission.address,
            'city': parsed_city,  # Extract city from address
            'postal_code': submission.postal_code,
            'notes': self._format_submission_notes(submission, request.data),
            'status': 'sent_to_kelly',  # Send directly to qualifier
            'assigned_agent': submission.field_agent,  # Assign to the canvasser who submitted
            'field_submission': submission,
        }
        
        try:
            if existing_lead:
                # Update existing lead - ensure it has status 'sent_to_kelly' and links to this submission
                logger.info(f"Found existing lead {existing_lead.id} for submission {submission.id}, updating...")
                for key, value in lead_data.items():
                    setattr(existing_lead, key, value)
                # Always set status to 'sent_to_kelly' for new submissions from canvassers
                existing_lead.status = 'sent_to_kelly'
                existing_lead.updated_at = timezone.now()
                existing_lead.save()
                logger.info(f"SUCCESS: Updated lead {existing_lead.id} (status: {existing_lead.status}) from field submission {submission.id}")
            else:
                # Create new lead
                lead_data['created_at'] = submission.timestamp
                lead_data['updated_at'] = submission.timestamp
                lead = Lead.objects.create(**lead_data)
                logger.info(f"SUCCESS: Created lead {lead.id} (status: {lead.status}) from field submission {submission.id} for qualifier review")
                logger.info(f"Lead details: name={lead.full_name}, phone={lead.phone}, status={lead.status}, assigned_agent={lead.assigned_agent_id}")
                # Verify the lead was created with correct status
                if lead.status != 'sent_to_kelly':
                    logger.error(f"WARNING: Lead {lead.id} was created with status '{lead.status}' instead of 'sent_to_kelly'")
        except Exception as e:
            logger.error(f"CRITICAL: Error creating/updating lead from field submission {submission.id}: {e}", exc_info=True)
            logger.error(f"Lead data that failed: {lead_data}")
            # Don't fail the submission if lead creation fails, but log it as critical
            # This is a critical error because the qualifier won't see the lead
        
        # Return the submission data
        response_serializer = FieldSubmissionSerializer(submission)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """
        Update an existing field submission and update the associated lead.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Log the raw request data before validation
        simplified_fields = ['owns_property', 'is_decision_maker', 'age_range', 'electric_bill', 
                           'has_received_other_quotes', 'preferred_contact_time']
        logger.info(f"Updating field submission {instance.id}")
        logger.info(f"Raw request.data simplified fields: {[(f, request.data.get(f, 'NOT IN REQUEST')) for f in simplified_fields]}")
        logger.info(f"Full request.data keys: {list(request.data.keys())}")
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Log the data being saved for debugging
        logger.info(f"Updating field submission {instance.id} with validated_data simplified fields: {[(f, serializer.validated_data.get(f, 'NOT IN VALIDATED')) for f in simplified_fields]}")
        
        # Update the field submission
        # The serializer will handle all fields including the new simplified form fields
        submission = serializer.save()
        
        # Refresh from database to ensure we have the latest values
        submission.refresh_from_db()
        
        # Log the saved values for debugging
        logger.info(f"Field submission {submission.id} after save - owns_property: {getattr(submission, 'owns_property', 'NOT IN MODEL')}, age_range: {getattr(submission, 'age_range', 'NOT IN MODEL')}, electric_bill: {getattr(submission, 'electric_bill', 'NOT IN MODEL')}")
        
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
            'notes': self._format_submission_notes(submission, request.data),
            'assigned_agent': submission.field_agent,
            'field_submission': submission,
        }
        
        try:
            if existing_lead:
                # Update existing lead but preserve status if it's been changed by qualifier
                # Only update status to 'sent_to_kelly' if it's still 'sent_to_kelly' or if it was never set
                # This prevents overwriting status changes made by qualifiers
                current_status = existing_lead.status
                for key, value in lead_data.items():
                    setattr(existing_lead, key, value)
                # Preserve status if qualifier has changed it from 'sent_to_kelly'
                # But if status is 'sent_to_kelly' or None/empty, ensure it's set to 'sent_to_kelly'
                if current_status and current_status != 'sent_to_kelly':
                    existing_lead.status = current_status
                else:
                    # Ensure status is 'sent_to_kelly' for new syncs or if it was already 'sent_to_kelly'
                    existing_lead.status = 'sent_to_kelly'
                existing_lead.updated_at = timezone.now()
                existing_lead.save()
                logger.info(f"Updated lead {existing_lead.id} (status: {existing_lead.status}) from field submission {submission.id}")
            else:
                # Create new lead if it doesn't exist (edge case - should not happen often)
                lead_data['status'] = 'sent_to_kelly'
                lead_data['created_at'] = submission.timestamp
                lead_data['updated_at'] = submission.timestamp
                lead = Lead.objects.create(**lead_data)
                logger.info(f"Created lead {lead.id} (status: {lead.status}) from updated field submission {submission.id} for qualifier review")
        except Exception as e:
            logger.error(f"CRITICAL: Error updating/creating lead from field submission {submission.id}: {e}", exc_info=True)
            logger.error(f"Lead data that failed: {lead_data}")
            # Don't fail the submission update if lead update fails
        
        # Return the updated submission data
        response_serializer = FieldSubmissionSerializer(submission)
        return Response(response_serializer.data)
    
    def _format_submission_notes(self, submission, request_data=None):
        """Format field submission data into notes for the lead (simplified format)."""
        # Helper to get field from request_data first, then submission object, then default
        def get_field(field_name, default='Not specified'):
            if request_data and field_name in request_data:
                value = request_data[field_name]
                return value if value else default
            return getattr(submission, field_name, None) or default
        
        # Get field values with safe defaults
        canvasser_name = get_field('canvasser_name') or getattr(submission.field_agent, 'get_full_name', lambda: getattr(submission.field_agent, 'username', 'Unknown'))()
        assessment_date = get_field('assessment_date') or (submission.timestamp.strftime('%d/%m/%Y') if hasattr(submission, 'timestamp') else 'Not specified')
        assessment_time = get_field('assessment_time') or (submission.timestamp.strftime('%H:%M') if hasattr(submission, 'timestamp') else 'Not specified')
        owns_property = get_field('owns_property')
        is_decision_maker = get_field('is_decision_maker')
        age_range = get_field('age_range')
        electric_bill = get_field('electric_bill')
        has_received_other_quotes = get_field('has_received_other_quotes')
        preferred_contact_time = get_field('preferred_contact_time')
        
        notes = f"Canvas Assessment by {canvasser_name}\n"
        notes += f"Date: {assessment_date} at {assessment_time}\n\n"
        
        # Property & Decision Making
        notes += "Property Information:\n"
        notes += f"- Owns Property: {owns_property}\n"
        notes += f"- Decision Maker: {is_decision_maker}\n"
        notes += f"- Age Range: {age_range}\n\n"
        
        # Electric Bill
        notes += "Energy Information:\n"
        notes += f"- Electric Bill: £{electric_bill}\n\n"
        
        # Customer Interest
        notes += "Customer Interest:\n"
        notes += f"- Other Quotes: {has_received_other_quotes}\n"
        notes += f"- Preferred Contact: {preferred_contact_time}\n\n"
        
        # Canvasser Notes
        if submission.notes:
            notes += f"Additional Notes:\n{submission.notes}\n\n"
        
        # Photos
        photo_count = 0
        if isinstance(submission.photos, dict):
            photo_count = sum(1 for v in submission.photos.values() if v)
        elif isinstance(submission.photos, list):
            photo_count = len(submission.photos)
        
        notes += f"Photos: {photo_count} captured"
        
        return notes

    @staticmethod
    def _format_submission_notes_for_bulk(submission_data, submission):
        """Format notes for bulk sync (static method)."""
        # Helper to get field from submission_data first, then submission object, then default
        def get_field(field_name, default='Not specified'):
            if submission_data and field_name in submission_data:
                value = submission_data[field_name]
                return value if value else default
            return getattr(submission, field_name, None) or default
        
        # Get field values with safe defaults
        canvasser_name = get_field('canvasser_name') or getattr(submission.field_agent, 'get_full_name', lambda: getattr(submission.field_agent, 'username', 'Unknown'))()
        assessment_date = get_field('assessment_date') or (submission.timestamp.strftime('%d/%m/%Y') if hasattr(submission, 'timestamp') else 'Not specified')
        assessment_time = get_field('assessment_time') or (submission.timestamp.strftime('%H:%M') if hasattr(submission, 'timestamp') else 'Not specified')
        owns_property = get_field('owns_property')
        is_decision_maker = get_field('is_decision_maker')
        age_range = get_field('age_range')
        electric_bill = get_field('electric_bill')
        has_received_other_quotes = get_field('has_received_other_quotes')
        preferred_contact_time = get_field('preferred_contact_time')
        
        notes = f"Canvas Assessment by {canvasser_name}\n"
        notes += f"Date: {assessment_date} at {assessment_time}\n\n"
        
        # Property & Decision Making
        notes += "Property Information:\n"
        notes += f"- Owns Property: {owns_property}\n"
        notes += f"- Decision Maker: {is_decision_maker}\n"
        notes += f"- Age Range: {age_range}\n\n"
        
        # Electric Bill
        notes += "Energy Information:\n"
        notes += f"- Electric Bill: £{electric_bill}\n\n"
        
        # Customer Interest
        notes += "Customer Interest:\n"
        notes += f"- Other Quotes: {has_received_other_quotes}\n"
        notes += f"- Preferred Contact: {preferred_contact_time}\n\n"
        
        # Canvasser Notes
        if submission.notes:
            notes += f"Additional Notes:\n{submission.notes}\n\n"
        
        # Photos
        photo_count = 0
        if isinstance(submission.photos, dict):
            photo_count = sum(1 for v in submission.photos.values() if v)
        elif isinstance(submission.photos, list):
            photo_count = len(submission.photos)
        
        notes += f"Photos: {photo_count} captured"
        
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
                'notes': FieldSubmissionViewSet._format_submission_notes_for_bulk(submission_data, submission),
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
