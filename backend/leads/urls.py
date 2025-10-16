from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import calendar_views

# Create a router for the ViewSet
router = DefaultRouter()
router.register(r'leads', views.LeadViewSet, basename='lead')

urlpatterns = [
    # Specific routes (must come before router to avoid conflicts)
    path('leads/my/', views.MyLeadsView.as_view(), name='my-leads'),
    path('leads/cold-call/', views.ColdCallLeadsView.as_view(), name='cold-call-leads'),
    path('leads/<int:lead_id>/disposition/', views.update_lead_disposition, name='update-disposition'),
    path('leads/<int:lead_id>/send-to-kelly/', views.send_to_kelly, name='send-to-kelly'),
    path('leads/<int:lead_id>/qualify/', views.qualify_lead, name='qualify-lead'),
    path('leads/<int:lead_id>/complete-appointment/', views.complete_appointment, name='complete-appointment'),
    path('dialer/', views.DialerControlView.as_view(), name='dialer-control'),
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:notification_id>/mark-read/', views.mark_notification_read, name='mark-notification-read'),
    path('notifications/<int:notification_id>/delete/', views.delete_notification, name='delete-notification'),
    path('notifications/mark-all-read/', views.mark_all_notifications_read, name='mark-all-notifications-read'),
    
    path('leads/bulk-delete-forever/', views.bulk_delete_leads_forever, name='bulk-delete-leads-forever'),
    path('leads/sync-to-sheets/', views.sync_leads_to_sheets, name='sync-leads-to-sheets'),
    path('leads/upload-json/', views.upload_json_leads, name='upload-json-leads'),
    
    # Callback routes
    path('callbacks/', views.callback_list, name='callback-list'),
    path('callbacks/create/', views.callback_create, name='callback-create'),
    path('callbacks/<int:callback_id>/update/', views.callback_update, name='callback-update'),
    path('callbacks/due-reminders/', views.callback_due_reminders, name='callback-due-reminders'),
    
    # Google Calendar OAuth routes
    path('auth/google/', calendar_views.google_calendar_auth, name='google-calendar-auth'),
    path('auth/google/callback/', calendar_views.google_calendar_callback, name='google-calendar-callback'),
    path('calendar/status/', calendar_views.google_calendar_status, name='google-calendar-status'),
    path('calendar/test/', calendar_views.google_calendar_test, name='google-calendar-test'),
    path('calendar/events/', calendar_views.create_calendar_event, name='create-calendar-event'),
    path('calendar/setup/', calendar_views.google_calendar_setup_page, name='google-calendar-setup'),
    
    # Include ViewSet routes (must come after specific routes)
    path('', include(router.urls)),
]