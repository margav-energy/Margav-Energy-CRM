from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

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
    path('notifications/mark-all-read/', views.mark_all_notifications_read, name='mark-all-notifications-read'),
    
    # Callback routes
    path('callbacks/', views.CallbackListCreateView.as_view(), name='callback-list-create'),
    path('callbacks/<int:pk>/', views.CallbackDetailView.as_view(), name='callback-detail'),
    path('callbacks/due/', views.callback_due_list, name='callback-due-list'),
    path('callbacks/schedule/', views.schedule_callback, name='schedule-callback'),
    path('callbacks/<int:callback_id>/update-status/', views.update_callback_status, name='update-callback-status'),
    
    # Include ViewSet routes (must come after specific routes)
    path('', include(router.urls)),
]