"""
Google Calendar OAuth views for Django backend.
"""
import logging
from django.shortcuts import redirect, render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .google_calendar_oauth import google_calendar_oauth_service

logger = logging.getLogger(__name__)

def google_calendar_auth(request):
    """
    Initiate Google Calendar OAuth flow.
    Redirects user to Google's OAuth consent page.
    """
    try:
        authorization_url = google_calendar_oauth_service.get_authorization_url()
        return redirect(authorization_url)
    except Exception as e:
        logger.error(f"Failed to initiate OAuth flow: {e}")
        return JsonResponse({
            'error': 'Failed to initiate Google Calendar authentication',
            'details': str(e)
        }, status=500)

def google_calendar_callback(request):
    """
    Handle Google OAuth callback.
    Exchange authorization code for tokens and store refresh token.
    """
    try:
        authorization_code = request.GET.get('code')
        if not authorization_code:
            return JsonResponse({
                'error': 'Authorization code not provided'
            }, status=400)
        
        # Handle the OAuth callback
        success = google_calendar_oauth_service.handle_oauth_callback(authorization_code)
        
        if success:
            return JsonResponse({
                'message': 'Google Calendar authentication successful!',
                'status': 'connected'
            })
        else:
            return JsonResponse({
                'error': 'Failed to authenticate with Google Calendar'
            }, status=500)
            
    except Exception as e:
        logger.error(f"Failed to handle OAuth callback: {e}")
        return JsonResponse({
            'error': 'Failed to handle OAuth callback',
            'details': str(e)
        }, status=500)

def google_calendar_status(request):
    """
    Check Google Calendar authentication status.
    """
    try:
        # Check if we have a refresh token
        has_token = bool(google_calendar_oauth_service.refresh_token)
        
        return JsonResponse({
            'authenticated': has_token,
            'status': 'connected' if has_token else 'disconnected'
        })
    except Exception as e:
        logger.error(f"Failed to check calendar status: {e}")
        return JsonResponse({
            'error': 'Failed to check calendar status',
            'details': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_calendar_event(request):
    """
    Create a calendar event using the stored OAuth credentials.
    
    Expected JSON payload:
    {
        "summary": "Event Title",
        "start_datetime": "2024-01-15T10:00:00",
        "end_datetime": "2024-01-15T11:00:00",
        "description": "Event description",
        "attendees": ["email@example.com"]
    }
    """
    try:
        data = request.data
        
        # Validate required fields
        required_fields = ['summary', 'start_datetime', 'end_datetime']
        for field in required_fields:
            if field not in data:
                return Response({
                    'error': f'Missing required field: {field}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse datetime strings
        from datetime import datetime
        start_datetime = datetime.fromisoformat(data['start_datetime'].replace('Z', '+00:00'))
        end_datetime = datetime.fromisoformat(data['end_datetime'].replace('Z', '+00:00'))
        
        # Create the event
        event_link = google_calendar_oauth_service.create_calendar_event(
            summary=data['summary'],
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            description=data.get('description', ''),
            attendees=data.get('attendees', [])
        )
        
        if event_link:
            return Response({
                'message': 'Calendar event created successfully',
                'event_link': event_link
            })
        else:
            return Response({
                'error': 'Failed to create calendar event'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except ValueError as e:
        return Response({
            'error': 'Invalid datetime format',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Failed to create calendar event: {e}")
        return Response({
            'error': 'Failed to create calendar event',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def google_calendar_test(request):
    """
    Test endpoint to verify Google Calendar integration.
    """
    try:
        # Check if service is initialized
        service_available = google_calendar_oauth_service.service is not None
        has_credentials = bool(google_calendar_oauth_service.refresh_token)
        
        return JsonResponse({
            'service_available': service_available,
            'has_credentials': has_credentials,
            'client_id_configured': bool(google_calendar_oauth_service.client_id),
            'client_secret_configured': bool(google_calendar_oauth_service.client_secret),
            'redirect_uri_configured': bool(google_calendar_oauth_service.redirect_uri),
            'status': 'ready' if service_available and has_credentials else 'needs_auth'
        })
    except Exception as e:
        logger.error(f"Failed to test calendar integration: {e}")
        return JsonResponse({
            'error': 'Failed to test calendar integration',
            'details': str(e)
        }, status=500)

def google_calendar_setup_page(request):
    """
    Serve the Google Calendar setup page.
    """
    return render(request, 'google_calendar_auth.html')
