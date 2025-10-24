from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import HttpResponse, FileResponse
from django.views.static import serve
import os
from accounts import admin_views
from django.conf import settings

# Import admin configuration to apply custom site settings
from . import admin as admin_config

def debug_view(request):
    """Debug view to test URL routing"""
    return HttpResponse(f"Debug: URL={request.path}, Method={request.method}")

def debug_static_files(request):
    """Debug view to check static files"""
    import os
    static_root = settings.STATIC_ROOT
    static_files = []
    if os.path.exists(static_root):
        for root, dirs, files in os.walk(static_root):
            for file in files:
                static_files.append(os.path.join(root, file).replace(str(static_root), ''))
    
    # Also check STATICFILES_DIRS
    static_dirs_info = []
    for static_dir in settings.STATICFILES_DIRS:
        if os.path.exists(static_dir):
            dir_files = []
            for root, dirs, files in os.walk(static_dir):
                for file in files:
                    dir_files.append(os.path.join(root, file).replace(str(static_dir), ''))
            static_dirs_info.append(f"{static_dir}: {', '.join(dir_files[:5])}")
        else:
            static_dirs_info.append(f"{static_dir}: NOT FOUND")
    
    return HttpResponse(f"""
    <h3>Static Files Debug</h3>
    <p><strong>STATIC_ROOT:</strong> {static_root}</p>
    <p><strong>STATIC_URL:</strong> {settings.STATIC_URL}</p>
    <p><strong>STATICFILES_DIRS:</strong></p>
    <ul>
        {''.join(f'<li>{info}</li>' for info in static_dirs_info)}
    </ul>
    <p><strong>Collected Files (first 10):</strong> {', '.join(static_files[:10])}</p>
    <p><strong>Total Files:</strong> {len(static_files)}</p>
    """)

def serve_favicon(request):
    """Serve favicon.ico from static files"""
    favicon_path = os.path.join(settings.STATIC_ROOT, 'favicon.ico')
    if os.path.exists(favicon_path):
        with open(favicon_path, 'rb') as f:
            return HttpResponse(f.read(), content_type='image/x-icon')
    
    # Try to serve from frontend build directory
    frontend_build_dir = settings.BASE_DIR.parent / 'frontend' / 'build'
    frontend_favicon = os.path.join(frontend_build_dir, 'favicon.ico')
    if os.path.exists(frontend_favicon):
        with open(frontend_favicon, 'rb') as f:
            return HttpResponse(f.read(), content_type='image/x-icon')
    
    return HttpResponse(status=404)

def serve_react_app(request):
    """Serve the React app's index.html from static files"""
    index_path = os.path.join(settings.STATIC_ROOT, 'index.html')
    if os.path.exists(index_path):
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HttpResponse(content, content_type='text/html')
    else:
        # Fallback to template if static file not found
        return TemplateView.as_view(template_name='index.html')(request)

def serve_data_upload(request):
    """Serve the data upload HTML page"""
    upload_path = os.path.join(settings.BASE_DIR.parent, 'data_upload.html')
    if os.path.exists(upload_path):
        with open(upload_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HttpResponse(content, content_type='text/html')
    else:
        return HttpResponse('Data upload page not found', status=404)

def serve_static_file(request, path):
    """Serve static files with proper MIME types"""
    # Try to serve from STATIC_ROOT first
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
    
    # Fallback: try to serve from STATICFILES_DIRS
    for static_dir in settings.STATICFILES_DIRS:
        fallback_path = os.path.join(static_dir, path)
        if os.path.exists(fallback_path):
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
            
            return FileResponse(open(fallback_path, 'rb'), content_type=content_type)
    
    return HttpResponse(status=404)

urlpatterns = [
    path('favicon.ico', serve_favicon, name='favicon'),
    path('debug/static/', debug_static_files, name='debug_static'),
    
    # Custom static file serving
    re_path(r'^static/(?P<path>.*)$', serve_static_file, name='static_files'),

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

# Data upload page
urlpatterns += [
    path('data_upload.html', serve_data_upload, name='data_upload'),
]

# React frontend routes
urlpatterns += [
    path('', serve_react_app, name='home'),
    path('dashboard/', serve_react_app, name='dashboard'),
    path('login/', serve_react_app, name='login'),
    re_path(r'^(?!api|admin|static|favicon\.ico|debug|data_upload\.html).*$', serve_react_app),
]
