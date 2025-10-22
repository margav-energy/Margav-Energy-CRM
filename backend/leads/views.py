from rest_framework import generics, filters, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
import logging
from .models import Lead, Dialer, LeadNotification, DialerUserLink, Callback
from django.conf import settings
from .serializers import (
    LeadSerializer, LeadCreateSerializer, LeadUpdateSerializer, 
    LeadDispositionSerializer, DialerSerializer, LeadNotificationSerializer,
    DialerLeadSerializer, CallbackSerializer, CallbackCreateSerializer
)
from .permissions import LeadPermission
from .google_sheets_service import GoogleSheetsService
from .excel_parser import ExcelLeadParser
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import tempfile
import hmac
import hashlib
import time
from django.utils import timezone

User = get_user_model()
logger = logging.getLogger(__name__)


class LeadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Lead model with role-based filtering and custom actions.
    """
    permission_classes = [IsAuthenticated, LeadPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'assigned_agent']
    search_fields = ['full_name', 'phone', 'email']
    ordering_fields = ['created_at', 'full_name', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return LeadCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return LeadUpdateSerializer
        return LeadSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Override create to return full lead data with related fields.
        """
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        lead = serializer.save()
        
        # Return the full lead data using LeadSerializer
        response_serializer = LeadSerializer(lead, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """
        Override update to return full lead data with related fields.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        lead = serializer.save()
        
        # Return the full lead data using LeadSerializer
        response_serializer = LeadSerializer(lead, context={'request': request})
        return Response(response_serializer.data)
    
    def get_queryset(self):
        user = self.request.user
        
        # Admins can see all leads
        if user.is_admin:
            return Lead.objects.all()
        
        # Agents can only see their own leads
        if user.is_agent:
            return Lead.objects.filter(assigned_agent=user)
        
        # Qualifiers can see leads they've processed (sent_to_kelly and beyond)
        if user.is_qualifier:
            return Lead.objects.filter(
                status__in=['sent_to_kelly', 'qualified', 'appointment_set', 'not_interested', 'no_contact', 'blow_out', 'pass_back_to_agent', 'on_hold', 'qualifier_callback']
            )
        
        # SalesReps can see leads with appointments
        if user.is_salesrep:
            return Lead.objects.filter(status='appointment_set')
        
        return Lead.objects.none()
    
    @action(detail=False, methods=['post', 'get'], url_path='from-dialer', permission_classes=[AllowAny])
    def from_dialer(self, request):
        """
        Create or update a lead from dialer when agent clicks "Client Interested".
        Handles comprehensive dialer data with proper logging.
        """
        # Accept both POST (JSON/body) and GET (query params) for dialer compatibility
        if request.method == 'GET':
            incoming_data = request.query_params.copy()
        else:
            incoming_data = request.data.copy()

        # Normalize common alternative param names from dialers
        # Support fullname -> full_name, phone_number -> phone, recording_filename -> recording_file
        if not incoming_data.get('full_name') and incoming_data.get('fullname'):
            incoming_data['full_name'] = incoming_data.get('fullname')
        if not incoming_data.get('phone') and incoming_data.get('phone_number'):
            incoming_data['phone'] = incoming_data.get('phone_number')
        if not incoming_data.get('recording_file') and incoming_data.get('recording_filename'):
            incoming_data['recording_file'] = incoming_data.get('recording_filename')

        logger.info(f"Received dialer lead data: {dict(incoming_data)}")
        
        # Security: IP allowlist check
        client_ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        allowed_ips = getattr(settings, 'DIALER_ALLOWED_IPS', [])
        if allowed_ips and client_ip not in allowed_ips:
            logger.warning(f'Dialer request from unauthorized IP: {client_ip}')
            return Response({'error': 'Unauthorized IP address'}, status=status.HTTP_403_FORBIDDEN)
        
        # API key validation - prefer header over query param for security
        api_key = (
            request.headers.get('X-Dialer-Api-Key') or 
            request.headers.get('x-dialer-api-key')
        )
        # Only allow query param api_key in development
        if not api_key and settings.DEBUG:
            api_key = incoming_data.get('api_key') or incoming_data.get('dialer_api_key')
        
        expected_key = getattr(settings, 'DIALER_API_KEY', None)
        
        # If no API key is configured, allow dialer to authenticate using user credentials
        if not expected_key:
            logger.info('No DIALER_API_KEY configured - allowing dialer authentication via user credentials')
        else:
            if not api_key or api_key != expected_key:
                logger.warning('Dialer API key missing or invalid')
                return Response({'error': 'Invalid API key'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # HMAC signature validation for production security (only if API key is configured)
        if not settings.DEBUG and expected_key:
            signature = request.headers.get('X-Dialer-Signature')
            timestamp = request.headers.get('X-Dialer-Timestamp')
            
            if not signature or not timestamp:
                logger.warning('Missing HMAC signature or timestamp')
                return Response({'error': 'Missing security headers'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check timestamp to prevent replay attacks (5 minute window)
            try:
                request_time = int(timestamp)
                current_time = int(time.time())
                if abs(current_time - request_time) > 300:  # 5 minutes
                    logger.warning(f'Request timestamp too old: {timestamp}')
                    return Response({'error': 'Request timestamp expired'}, status=status.HTTP_401_UNAUTHORIZED)
            except ValueError:
                logger.warning(f'Invalid timestamp format: {timestamp}')
                return Response({'error': 'Invalid timestamp format'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify HMAC signature
            secret_key = getattr(settings, 'DIALER_SECRET_KEY', expected_key)
            if secret_key:
                # Create canonical string for signing
                canonical_params = []
                for key in sorted(incoming_data.keys()):
                    if key not in ['api_key', 'dialer_api_key', 'signature']:  # Exclude auth params
                        canonical_params.append(f"{key}={incoming_data[key]}")
                canonical_string = "&".join(canonical_params)
                
                expected_signature = hmac.new(
                    secret_key.encode('utf-8'),
                    canonical_string.encode('utf-8'),
                    hashlib.sha256
                ).hexdigest()
                
                if not hmac.compare_digest(signature, expected_signature):
                    logger.warning('HMAC signature validation failed')
                    return Response({'error': 'Invalid signature'}, status=status.HTTP_401_UNAUTHORIZED)

        # Validate required fields - prefer dialer_user_id mapping; fallback to user
        required_fields = []
        if not incoming_data.get('dialer_user_id') and not incoming_data.get('user'):
            required_fields = ['dialer_user_id or user']
        missing_fields = [field for field in required_fields if not incoming_data.get(field)]
        
        if missing_fields:
            logger.warning(f"Missing required fields: {missing_fields}")
            return Response({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Resolve agent via dialer mapping first; fallback to username
        agent = None
        dialer_user_id = incoming_data.get('dialer_user_id')
        if dialer_user_id:
            link = DialerUserLink.objects.filter(dialer_user_id=dialer_user_id).select_related('crm_user').first()
            if link:
                agent = link.crm_user
        if agent is None and incoming_data.get('user'):
            agent_username = incoming_data.get('user')
            try:
                agent = User.objects.get(username=agent_username)
            except User.DoesNotExist:
                agent = None
        if agent is None:
            logger.error("Agent mapping not found for provided dialer_user_id/username")
            return Response({'error': 'Agent mapping not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if lead already exists by dialer_lead_id or phone
        lead_id = incoming_data.get('lead_id')
        phone = incoming_data.get('phone') or incoming_data.get('phone_number')
        existing_lead = None
        
        if lead_id:
            try:
                existing_lead = Lead.objects.get(dialer_lead_id=lead_id)
                logger.info(f"Found existing lead by dialer_lead_id: {lead_id} (CRM Lead ID: {existing_lead.id})")
            except Lead.DoesNotExist:
                logger.info(f"No existing lead found with dialer_lead_id: {lead_id}")
        
        if not existing_lead and phone:
            try:
                existing_lead = Lead.objects.get(phone=phone)
                logger.info(f"Found existing lead by phone: {phone} (CRM Lead ID: {existing_lead.id})")
            except Lead.DoesNotExist:
                logger.info(f"No existing lead found with phone: {phone}")
        
        # Prepare comprehensive lead data
        lead_data = incoming_data.copy()
        lead_data['assigned_agent'] = agent.id
        lead_data['status'] = lead_data.get('status', 'interested')
        
        # Handle dialer_lead_id mapping
        if lead_id:
            lead_data['dialer_lead_id'] = lead_id
        
        # Use DialerLeadSerializer for comprehensive data handling
        serializer = DialerLeadSerializer(data=lead_data)
        
        if serializer.is_valid():
            try:
                if existing_lead:
                    # Update existing lead
                    logger.info(f"Updating existing lead ID: {existing_lead.id}")
                    lead = serializer.update(existing_lead, serializer.validated_data)
                    logger.info(f"Successfully updated lead ID: {lead.id}")
                else:
                    # Create new lead
                    logger.info("Creating new lead from dialer data")
                    lead = serializer.save()
                    logger.info(f"Successfully created lead ID: {lead.id}")
                
                # Return success response with lead data
                response_data = {
                    'success': True,
                    'lead': LeadSerializer(lead).data,
                    'message': 'Lead updated successfully' if existing_lead else 'Lead created successfully'
                }
                
                logger.info(f"Returning success response for lead ID: {lead.id}")
                return Response(response_data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"Error saving lead: {str(e)}")
                return Response({
                    'error': 'Failed to save lead',
                    'details': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            logger.error(f"Serializer validation failed: {serializer.errors}")
            return Response({
                'error': 'Failed to create/update lead',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


# Keep the old class names for backward compatibility
class LeadListCreateView(generics.ListCreateAPIView):
    """
    List leads or create a new lead with role-based filtering.
    """
    permission_classes = [IsAuthenticated, LeadPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'assigned_agent']
    search_fields = ['full_name', 'phone', 'email']
    ordering_fields = ['created_at', 'full_name', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LeadCreateSerializer
        return LeadSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Admins can see all leads
        if user.is_admin:
            return Lead.objects.all()
        
        # Agents can only see their own leads
        if user.is_agent:
            return Lead.objects.filter(assigned_agent=user)
        
        # Qualifiers can see leads they've processed (sent_to_kelly and beyond)
        if user.is_qualifier:
            return Lead.objects.filter(
                status__in=['sent_to_kelly', 'qualified', 'appointment_set', 'not_interested', 'no_contact', 'blow_out', 'pass_back_to_agent', 'on_hold', 'qualifier_callback']
            )
        
        # SalesReps can see leads with appointments
        if user.is_salesrep:
            return Lead.objects.filter(status='appointment_set')
        
        return Lead.objects.none()


class LeadDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a lead.
    """
    permission_classes = [IsAuthenticated, LeadPermission]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return LeadUpdateSerializer
        return LeadSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Admins can see all leads
        if user.is_admin:
            return Lead.objects.all()
        
        # Agents can only see their own leads
        if user.is_agent:
            return Lead.objects.filter(assigned_agent=user)
        
        # Qualifiers can see leads they've processed (sent_to_kelly and beyond)
        if user.is_qualifier:
            return Lead.objects.filter(
                status__in=['sent_to_kelly', 'qualified', 'appointment_set', 'not_interested', 'no_contact', 'blow_out', 'pass_back_to_agent', 'on_hold', 'qualifier_callback']
            )
        
        # SalesReps can see leads with appointments
        if user.is_salesrep:
            return Lead.objects.filter(status='appointment_set')
        
        return Lead.objects.none()


class MyLeadsView(generics.ListAPIView):
    """
    Get leads assigned to the current user.
    """
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['full_name', 'phone', 'email']
    ordering_fields = ['created_at', 'full_name', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Lead.objects.filter(assigned_agent=self.request.user)


class DialerControlView(generics.RetrieveUpdateAPIView):
    """
    Control the dialer system (admin only).
    """
    serializer_class = DialerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        dialer, created = Dialer.objects.get_or_create(
            defaults={'created_by': self.request.user}
        )
        return dialer
    
    def get_queryset(self):
        return Dialer.objects.all()


class ColdCallLeadsView(generics.ListAPIView):
    """
    Get cold call leads assigned to the current agent when dialer is active.
    """
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only return cold call leads assigned to the current agent when dialer is active
        try:
            dialer = Dialer.objects.latest('created_at')
            if dialer.is_active:
                return Lead.objects.filter(
                    status='cold_call',
                    assigned_agent=self.request.user
                )
        except Dialer.DoesNotExist:
            pass
        return Lead.objects.none()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_lead_disposition(request, lead_id):
    """
    Update lead disposition after cold call.
    """
    try:
        lead = Lead.objects.get(id=lead_id, assigned_agent=request.user)
    except Lead.DoesNotExist:
        return Response({'error': 'Lead not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = LeadDispositionSerializer(lead, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_to_kelly(request, lead_id):
    """
    Send interested lead to Kelly for qualification.
    """
    try:
        lead = Lead.objects.get(id=lead_id, assigned_agent=request.user)
    except Lead.DoesNotExist:
        return Response({'error': 'Lead not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if lead.status == 'interested':
        lead.status = 'sent_to_kelly'
        lead.save()
        return Response({'message': 'Lead sent to Kelly for qualification'})
    
    return Response({'error': 'Only interested leads can be sent to Kelly'}, 
                   status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def qualify_lead(request, lead_id):
    """
    Kelly qualifies a lead and notifies the agent.
    """
    try:
        lead = Lead.objects.get(id=lead_id)
    except Lead.DoesNotExist:
        return Response({'error': 'Lead not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = LeadUpdateSerializer(lead, data=request.data, partial=True)
    if serializer.is_valid():
        old_status = lead.status
        old_appointment_date = lead.appointment_date
        updated_lead = serializer.save()
        
        # Sync to Google Calendar if appointment is set
        calendar_synced = False
        if updated_lead.status == 'appointment_set' and updated_lead.appointment_date:
            calendar_synced = updated_lead.sync_to_google_calendar()
        
        # Create notification for the agent
        from .models import LeadNotification
        notification_message = f"Lead {lead.full_name} status updated to: {updated_lead.get_status_display()}"
        
        # Handle special status transitions
        if updated_lead.status == 'blow_out':
            # Blow out should return to agent as not interested
            updated_lead.status = 'not_interested'
            updated_lead.save()
            notification_message = f"Lead {lead.full_name} marked as Blow Out - returned to agent as Not Interested"
        elif updated_lead.status == 'pass_back_to_agent':
            # Pass back to agent should be recognized as a callback (no new callback created)
            notification_message = f"Lead {lead.full_name} passed back to agent - recognized as callback"
        
        # Check Google Calendar status only when setting an appointment
        if updated_lead.status == 'appointment_set':
            try:
                from .google_calendar_oauth import google_calendar_oauth_service
                
                calendar_available = google_calendar_oauth_service.get_connection_status() == "connected"
                
                if not calendar_available:
                    # Add warning to the notification message
                    notification_message += " (Warning: Google Calendar service unavailable - appointment may not sync to calendar)"
                    
            except Exception as e:
                logger.error(f"Error checking Google Calendar during appointment setting: {e}")
        
        # Add calendar sync info to notification
        if calendar_synced:
            notification_message += " (Calendar event created)"
        elif updated_lead.status == 'appointment_set':
            notification_message += " (Calendar sync failed - please check manually)"
        
        LeadNotification.objects.create(
            lead=updated_lead,
            agent=updated_lead.assigned_agent,
            qualifier=request.user,
            message=notification_message,
            notification_type='status_update'
        )
        
        return Response({
            'lead': LeadSerializer(updated_lead).data,
            'notification': {
                'message': notification_message,
                'agent': updated_lead.assigned_agent.get_full_name(),
                'status': updated_lead.get_status_display()
            },
            'calendar_synced': calendar_synced
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_appointment(request, lead_id):
    """
    Field sales rep completes appointment and records sale result.
    """
    try:
        lead = Lead.objects.get(id=lead_id, field_sales_rep=request.user, status='appointment_set')
    except Lead.DoesNotExist:
        return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = LeadUpdateSerializer(lead, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationListView(generics.ListAPIView):
    """
    Get notifications for the current agent.
    """
    serializer_class = LeadNotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return LeadNotification.objects.filter(agent=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """
    Mark a notification as read.
    """
    try:
        notification = LeadNotification.objects.get(
            id=notification_id, 
            agent=request.user
        )
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marked as read'})
    except LeadNotification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """
    Mark all notifications as read for the current agent.
    """
    LeadNotification.objects.filter(agent=request.user, is_read=False).update(is_read=True)
    return Response({'message': 'All notifications marked as read'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    """
    Delete a notification.
    """
    try:
        notification = LeadNotification.objects.get(
            id=notification_id, 
            agent=request.user
        )
        notification.delete()
        return Response({'message': 'Notification deleted'})
    except LeadNotification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_delete_leads_forever(request):
    """
    Permanently delete multiple leads (hard delete).
    """
    lead_ids = request.data.get('lead_ids', [])
    if not lead_ids:
        return Response({'error': 'No lead IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get leads that belong to the current agent
        leads = Lead.objects.filter(
            id__in=lead_ids,
            assigned_agent=request.user
        )
        
        count = leads.count()
        if count == 0:
            return Response({'error': 'No leads found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Hard delete the leads
        leads.delete()
        
        return Response({
            'message': f'{count} leads permanently deleted',
            'deleted_count': count
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_leads_to_sheets(request):
    """
    Sync all leads to Google Sheets
    """
    try:
        # Check if user has permission (admin only)
        if not request.user.is_admin:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all leads (including deleted ones for audit trail)
        leads = Lead.objects.all()
        
        if not leads.exists():
            return Response({'error': 'No leads found to sync'}, status=status.HTTP_404_NOT_FOUND)
        
        # Initialize Google Sheets service
        sheets_service = GoogleSheetsService()
        
        # Sync all leads
        result = sheets_service.sync_all_leads_to_sheets()
        
        if result['success'] > 0:
            return Response({
                'message': f'Successfully synced {result["success"]} leads to Google Sheets',
                'success_count': result['success'],
                'failed_count': result['failed']
            })
        else:
            return Response({
                'error': 'Failed to sync leads to Google Sheets',
                'success_count': result['success'],
                'failed_count': result['failed']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Error syncing leads to Google Sheets: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




# Callback Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def callback_list(request):
    """
    List callbacks for the authenticated user.
    """
    try:
        user = request.user
        
        # Get callbacks based on user role
        if user.is_admin:
            callbacks = Callback.objects.filter(is_deleted=False)
        elif user.is_agent:
            callbacks = Callback.objects.filter(created_by=user, is_deleted=False)
        else:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Filter by status if provided
        status_filter = request.GET.get('status')
        if status_filter:
            callbacks = callbacks.filter(status=status_filter)
        
        # Order by scheduled time
        callbacks = callbacks.order_by('scheduled_time')
        
        serializer = CallbackSerializer(callbacks, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error fetching callbacks: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def callback_create(request):
    """
    Create a new callback.
    """
    try:
        serializer = CallbackCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            callback = serializer.save()
            response_serializer = CallbackSerializer(callback)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Error creating callback: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def callback_update(request, callback_id):
    """
    Update a callback.
    """
    try:
        callback = Callback.objects.get(id=callback_id, is_deleted=False)
        
        # Check permissions
        if not request.user.is_admin and callback.created_by != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CallbackSerializer(callback, data=request.data, partial=True)
        if serializer.is_valid():
            updated_callback = serializer.save()
            
            # If status is being updated to 'completed', set completed_at
            if 'status' in request.data and request.data['status'] == 'completed':
                from django.utils import timezone
                updated_callback.completed_at = timezone.now()
                updated_callback.save()
            
            return Response(CallbackSerializer(updated_callback).data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Callback.DoesNotExist:
        return Response({'error': 'Callback not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error updating callback: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def callback_due_reminders(request):
    """
    Get callbacks that are due or overdue for reminders.
    """
    try:
        user = request.user
        
        # Get callbacks that are due or overdue
        from django.utils import timezone
        now = timezone.now()
        
        if user.is_admin:
            callbacks = Callback.objects.filter(
                is_deleted=False,
                status='scheduled',
                scheduled_time__lte=now
            )
        elif user.is_agent:
            callbacks = Callback.objects.filter(
                created_by=user,
                is_deleted=False,
                status='scheduled',
                scheduled_time__lte=now
            )
        else:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CallbackSerializer(callbacks, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error fetching due callbacks: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_json_leads(request):
    """
    Upload JSON file and bulk import leads.
    Admin only endpoint.
    """
    try:
        # Check if user is admin
        if not request.user.is_admin:
            return Response({'error': 'Permission denied. Admin access required.'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Check if file is provided
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        json_file = request.FILES['file']
        
        # Validate file type
        if not json_file.name.endswith('.json'):
            return Response({'error': 'Invalid file type. Please upload a JSON file (.json)'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Parse JSON file
            import json
            from io import TextIOWrapper
            
            # Read JSON file
            json_data = json.load(TextIOWrapper(json_file, encoding='utf-8'))
            
            # Validate JSON structure
            if not isinstance(json_data, list):
                return Response({
                    'error': 'JSON file must contain an array of lead objects'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Process leads
            created_count = 0
            failed_count = 0
            created_leads = []
            failed_leads = []
            errors = []
            
            for index, lead_data in enumerate(json_data):
                try:
                    # Validate required fields
                    required_fields = ['full_name', 'phone']
                    missing_fields = [field for field in required_fields if field not in lead_data]
                    if missing_fields:
                        failed_leads.append({
                            'data': lead_data,
                            'error': f"Missing required fields: {', '.join(missing_fields)}"
                        })
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
                            failed_leads.append({
                                'data': lead_data,
                                'error': f"Agent not found: {agent_id}"
                            })
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
                    lead = Lead.objects.create(**lead_obj_data)
                    created_leads.append({
                        'id': lead.id,
                        'full_name': lead.full_name,
                        'phone': lead.phone,
                        'status': lead.status
                    })
                    created_count += 1
                    
                except Exception as e:
                    failed_leads.append({
                        'data': lead_data,
                        'error': str(e)
                    })
                    failed_count += 1
                    continue
            
            # Prepare response
            response_data = {
                'message': f'Successfully processed {len(json_data)} leads',
                'created_count': created_count,
                'failed_count': failed_count,
                'created_leads': created_leads,
                'errors': errors
            }
            
            if failed_leads:
                response_data['failed_leads'] = [
                    {
                        'full_name': failed['data'].get('full_name', 'Unknown'),
                        'phone': failed['data'].get('phone', 'Unknown'),
                        'error': failed['error']
                    } for failed in failed_leads
                ]
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except json.JSONDecodeError as e:
            return Response({
                'error': f'Invalid JSON format: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': f'Error processing JSON file: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Error uploading JSON file: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

