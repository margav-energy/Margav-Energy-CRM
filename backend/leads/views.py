from rest_framework import generics, filters, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
import logging
from .models import Lead, Dialer, LeadNotification, DialerUserLink
from django.conf import settings
from .serializers import (
    LeadSerializer, LeadCreateSerializer, LeadUpdateSerializer, 
    LeadDispositionSerializer, DialerSerializer, LeadNotificationSerializer,
    DialerLeadSerializer
)
from .permissions import LeadPermission

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
                status__in=['sent_to_kelly', 'qualified', 'appointment_set', 'not_interested', 'no_contact', 'blow_out', 'callback', 'pass_back_to_agent']
            )
        
        # SalesReps can see leads with appointments
        if user.is_salesrep:
            return Lead.objects.filter(status='appointment_set')
        
        return Lead.objects.none()
    
    @action(detail=False, methods=['post'], url_path='from-dialer', permission_classes=[AllowAny])
    def from_dialer(self, request):
        """
        Create or update a lead from dialer when agent clicks "Client Interested".
        Handles comprehensive dialer data with proper logging.
        """
        logger.info(f"Received dialer lead data: {request.data}")
        
        # Optional API key check
        api_key = request.headers.get('X-Dialer-Api-Key') or request.headers.get('x-dialer-api-key')
        expected_key = getattr(settings, 'DIALER_API_KEY', None)
        if expected_key:
            if not api_key or api_key != expected_key:
                logger.warning('Dialer API key missing or invalid')
                return Response({'error': 'Invalid API key'}, status=status.HTTP_401_UNAUTHORIZED)

        # Validate required fields - prefer dialer_user_id mapping; fallback to user
        required_fields = []
        if not request.data.get('dialer_user_id') and not request.data.get('user'):
            required_fields = ['dialer_user_id or user']
        missing_fields = [field for field in required_fields if not request.data.get(field)]
        
        if missing_fields:
            logger.warning(f"Missing required fields: {missing_fields}")
            return Response({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Resolve agent via dialer mapping first; fallback to username
        agent = None
        dialer_user_id = request.data.get('dialer_user_id')
        if dialer_user_id:
            link = DialerUserLink.objects.filter(dialer_user_id=dialer_user_id).select_related('crm_user').first()
            if link:
                agent = link.crm_user
        if agent is None and request.data.get('user'):
            agent_username = request.data.get('user')
            try:
                agent = User.objects.get(username=agent_username)
            except User.DoesNotExist:
                agent = None
        if agent is None:
            logger.error("Agent mapping not found for provided dialer_user_id/username")
            return Response({'error': 'Agent mapping not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if lead already exists by dialer_lead_id or phone
        lead_id = request.data.get('lead_id')
        phone = request.data.get('phone') or request.data.get('phone_number')
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
        lead_data = request.data.copy()
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
                status__in=['sent_to_kelly', 'qualified', 'appointment_set', 'not_interested', 'no_contact', 'blow_out', 'callback', 'pass_back_to_agent']
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
                status__in=['sent_to_kelly', 'qualified', 'appointment_set', 'not_interested', 'no_contact', 'blow_out', 'callback', 'pass_back_to_agent']
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
        lead = Lead.objects.get(id=lead_id, status='sent_to_kelly')
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
            'lead': serializer.data,
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