from django.urls import path
from . import views
from . import admin_views

urlpatterns = [
    path('users/', views.UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/me/', views.get_current_user, name='current-user'),
    path('api-token-auth/', views.obtain_auth_token, name='api-token-auth'),
    # Admin views
    path('admin/bulk-creation/', admin_views.bulk_user_creation, name='bulk_user_creation'),
    path('admin/create-single-user/', admin_views.create_single_user, name='create_single_user'),
]
