"""
Custom static file serving views for proper MIME types
"""
import os
import mimetypes
from django.http import HttpResponse, Http404
from django.conf import settings
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods


@never_cache
@require_http_methods(["GET"])
def serve_static_file(request, path):
    """
    Serve static files with proper MIME types
    """
    # Construct the full file path
    file_path = os.path.join(settings.STATIC_ROOT, path)
    
    # Check if file exists
    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        raise Http404("File not found")
    
    # Get MIME type
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        # Default MIME types for common file extensions
        if file_path.endswith('.css'):
            mime_type = 'text/css'
        elif file_path.endswith('.js'):
            mime_type = 'application/javascript'
        elif file_path.endswith('.ico'):
            mime_type = 'image/x-icon'
        else:
            mime_type = 'application/octet-stream'
    
    # Read file content
    with open(file_path, 'rb') as f:
        content = f.read()
    
    # Create response with proper MIME type
    response = HttpResponse(content, content_type=mime_type)
    
    # Set cache headers
    response['Cache-Control'] = 'public, max-age=31536000'  # 1 year
    
    return response
