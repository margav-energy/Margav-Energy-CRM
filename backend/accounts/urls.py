from django.urls import path
from . import views
from . import admin_views
from . import data_upload_views
from . import admin_dashboard_views

urlpatterns = [
    path('users/', views.UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/me/', views.get_current_user, name='current-user'),
    path('users/change-password/', views.change_password, name='change-password'),
    path('users/change-password-for-user/', views.change_password_for_user, name='change-password-for-user'),
    path('api-token-auth/', views.obtain_auth_token, name='api-token-auth'),
    # Data upload endpoints
    path('upload-data/', data_upload_views.upload_data, name='upload_data'),
    path('upload-status/', data_upload_views.upload_status, name='upload_status'),
    # Admin views
    path('admin/bulk-creation/', admin_views.bulk_user_creation, name='bulk_user_creation'),
    path('admin/create-single-user/', admin_views.create_single_user, name='create_single_user'),
    path('admin/dashboard/', admin_dashboard_views.admin_dashboard, name='admin_dashboard'),
]
