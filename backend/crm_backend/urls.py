from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import HttpResponse, FileResponse
from django.views.static import serve
import os
from accounts import admin_views

# Import admin configuration to apply custom site settings
from . import admin as admin_config

def debug_view(request):
    """Debug view to test URL routing"""
    return HttpResponse(f"Debug: URL={request.path}, Method={request.method}")

def serve_favicon(request):
    """Serve favicon.ico from static files"""
    favicon_path = os.path.join(settings.STATIC_ROOT, 'favicon.ico')
    if os.path.exists(favicon_path):
        with open(favicon_path, 'rb') as f:
            return HttpResponse(f.read(), content_type='image/x-icon')
    return HttpResponse(status=404)

def serve_static_file(request, path):
    """Serve static files with proper MIME types"""
    file_path = os.path.join(settings.STATIC_ROOT, path)
    if os.path.exists(file_path):
        # Determine MIME type based on file extension
        if path.endswith('.css'):
            content_type = 'text/css'
        elif path.endswith('.js'):
            content_type = 'application/javascript'
        elif path.endswith('.png'):
            content_type = 'image/png'
        elif path.endswith('.jpg') or path.endswith('.jpeg'):
            content_type = 'image/jpeg'
        elif path.endswith('.ico'):
            content_type = 'image/x-icon'
        else:
            content_type = 'application/octet-stream'
        
        return FileResponse(open(file_path, 'rb'), content_type=content_type)
    return HttpResponse(status=404)

urlpatterns = [
    path('favicon.ico', serve_favicon, name='favicon'),
    path('static/<path:path>', serve_static_file, name='static_file'),

    # Custom admin views
    path('admin/accounts/user/bulk-creation/', admin.site.admin_view(admin_views.bulk_user_creation), name='admin_accounts_user_bulk_creation'),
    path('admin/accounts/user/create-single-user/', admin.site.admin_view(admin_views.create_single_user), name='admin_create_single_user'),
    path('admin/accounts/user/delete/<str:username>/', admin.site.admin_view(admin_views.delete_user), name='admin_delete_user'),
    path('admin/accounts/user/reset-password/', admin.site.admin_view(admin_views.reset_user_password), name='admin_reset_user_password'),
    path('admin/accounts/user/stats/', admin.site.admin_view(admin_views.get_user_stats), name='admin_user_stats'),
    path('admin/', admin.site.urls),

    # API routes
    path('api/', include('accounts.urls')),
    path('api/', include('leads.urls')),
]

# Static files serving
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Only add media static serving if MEDIA_URL is not root
    if settings.MEDIA_URL and settings.MEDIA_URL != '/':
        urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # In production, also serve static files explicitly as fallback
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# React frontend routes
urlpatterns += [
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('dashboard/', TemplateView.as_view(template_name='index.html'), name='dashboard'),
    path('login/', TemplateView.as_view(template_name='index.html'), name='login'),
    re_path(r'^(?!api|admin|static|favicon\.ico).*$', TemplateView.as_view(template_name='index.html')),
]
