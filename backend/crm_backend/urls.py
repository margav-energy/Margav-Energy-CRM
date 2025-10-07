"""
URL configuration for crm_backend project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from accounts import admin_views

urlpatterns = [
    # Custom admin views (must come before admin.site.urls)
    path('admin/accounts/user/bulk-creation/', admin.site.admin_view(admin_views.bulk_user_creation), name='admin_accounts_user_bulk_creation'),
    path('admin/accounts/user/create-single-user/', admin.site.admin_view(admin_views.create_single_user), name='admin_create_single_user'),
    path('admin/accounts/user/delete/<str:username>/', admin.site.admin_view(admin_views.delete_user), name='admin_delete_user'),
    path('admin/accounts/user/reset-password/', admin.site.admin_view(admin_views.reset_user_password), name='admin_reset_user_password'),
    path('admin/accounts/user/stats/', admin.site.admin_view(admin_views.get_user_stats), name='admin_user_stats'),
    # Main admin and API URLs
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('leads.urls')),
    # Serve React frontend
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # In production, WhiteNoise handles static files
    pass
